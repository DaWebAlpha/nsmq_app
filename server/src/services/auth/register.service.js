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
    resolveId,
    pickAllowedFields,
} from "../../utils/index.js";

import { recordAuditLog } from "../audit/index.js";

/**
 * Fields a caller is allowed to set at registration — an explicit
 * allow-list so a stray `role`/`isPremiumAccess` key in `input` can
 * never be mass-assigned onto a new account.
 */
const ALLOWED_FIELDS = [
    "firstName",
    "lastName",
    "email",
    "phoneNumber",
    "password",
]

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

   
    const payload = pickAllowedFields(input, ALLOWED_FIELDS);

    
    return withTransaction(async (session) => {
        let user;

        try{
            [user] = await User.create([payload], {session});

        }catch(error){
            translateMongooseWriteError(error);
        }


        const userId = resolveId(user);
        const context = getAuditRequestContext(requestContext);

        const accessToken = await generateAccessToken(userId);
        const refreshToken = await generateRefreshToken({
            userId,
            ...context,
            session,
        })

        
        await LoginLog.create([{
            userId,
            identifier: user.email,
            reason: "Registration",
            ...context,
        }], { session });

        
        await recordAuditLog({
            entityType: "User",
            entityId: userId,
            action: "user.registered",
            performedBy: userId,
            session,
            ...context,
        });


        return { user, accessToken, refreshToken };
    })
}

export {
    registerUserService,
}
