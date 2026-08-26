import {
    User,
    LoginLog,
} from "../../models/index.js";

import {
    withTransaction,
    translateMongooseWriteError,
    generateAccessToken,
    generateRefreshToken,
    getAuditRequestContext,
} from "../../utils/index.js";

import { recordAuditLog } from "../audit/index.js";

/**
 * Normalizes a Mongoose document (or a plain `{id}`/`{_id}` object) down to
 * a plain string id, or `null` if neither shape is present.
 * @param {import("mongoose").Document|{id?: string}|{_id?: import("mongoose").Types.ObjectId}|null|undefined} doc
 * @returns {string|null}
 */
const resolveId = (doc) => doc?._id.toString() ?? doc?.id.toString() ?? null;

/** Fields a caller is allowed to set at registration — an explicit allow-list so a stray `role`/`isPremiumAccess` key in `input` can never be mass-assigned onto a new account. */
const ALLOWED_FIELDS = [
    "firstName",
    "lastName",
    "email",
    "phoneNumber",
    "password",
]

/**
 * Strips `source` down to only the keys in `ALLOWED_FIELDS`, dropping
 * everything else (e.g. `role`, `isPremiumAccess`) before it ever reaches
 * `User.create(...)`.
 * @param {object} [source={}] - Raw registration input, typically `req.body`.
 * @returns {object} A copy containing only allow-listed keys present in `source`.
 */
const pickAllowedFields = (source = {}) => {
    const result = {};

    // LOOP over only the safe, known fields (never over whatever keys the caller sent).
    for(const field of ALLOWED_FIELDS){
        // IF the caller actually provided this field, copy it over.
        // Anything NOT in ALLOWED_FIELDS (like "role") is never even looked at.
        if(source[field] !== undefined){
            result[field] = source[field];
        }
    }
    return result;
}

/**
 * Registers a new user inside a transaction: creates the `User` (mass-assignment
 * safe via `pickAllowedFields`), issues an access/refresh token pair, and
 * writes a `LoginLog` ("Registration") plus an `AuditLog` ("user.registered")
 * entry — all committed together, or all rolled back together on failure.
 * @param {object} params
 * @param {object} [params.input] - Raw registration payload; only `ALLOWED_FIELDS` are used.
 * @param {object} [params.requestContext] - Result of `getAuditRequestContext(request)`, spread into the `LoginLog`/`AuditLog` entries.
 * @returns {Promise<{ user: import("mongoose").Document, accessToken: string, refreshToken: string }>}
 * @throws {import("../../errors/index.js").ConflictError|import("../../errors/index.js").BadRequestError} Via `translateMongooseWriteError`, if the email/phoneNumber is already taken or validation fails.
 */
const registerUserService = async ({
    input = {},
    requestContext = {},
} = {}) => {

    // STEP 1: Strip the raw input down to only the fields a new user is allowed to set.
    const payload = pickAllowedFields(input);

    // Everything below runs inside one MongoDB transaction — either all four
    // writes (User, RefreshToken, LoginLog, AuditLog) succeed together, or
    // none of them are kept.
    return withTransaction(async (session) => {
        let user;

        // STEP 2: Create the User document. Mongoose's session-array form
        // (`User.create([payload], {session})`) returns an ARRAY of created
        // docs, so we destructure the single result out as `user`.
        try{
            [user] = await User.create([payload], {session});

        }catch(error){
            // IF the email/phone is already taken, or a field fails validation,
            // translateMongooseWriteError converts MongoDB's raw error into a
            // typed AppError (ConflictError/BadRequestError) and throws it —
            // this stops execution here, so nothing below runs on failure.
            translateMongooseWriteError(error);
        }

        // STEP 3: Turn the new user's id into a plain string, and collect
        // ip/userAgent/device info from the incoming request — both are
        // needed by every write that follows.
        const userId = resolveId(user);
        const context = getAuditRequestContext(requestContext);

        // STEP 4: Issue this brand-new user a real session immediately —
        // registering should log you in, not just create an account.
        const accessToken = await generateAccessToken(userId);
        const refreshToken = await generateRefreshToken({
            userId,
            ...context,
            session,
        })

        // STEP 5: Record that this counts as a "login" event too (registration
        // IS the first login), for the LoginLog's activity history.
        await LoginLog.create([{
            userId,
            identifier: user.email,
            reason: "Registration",
            ...context,
        }], { session });

        // STEP 6: Write the general audit-trail entry for "a new user account
        // was created."
        await recordAuditLog({
            entityType: "User",
            entityId: userId,
            action: "user.registered",
            performedBy: userId,
            session,
            ...context,
        });

        // STEP 7: Hand back everything a controller needs to respond to the client.
        return { user, accessToken, refreshToken };
    })
}

export {
    registerUserService,
}
