import {
    User,
    LoginLog,
    UserSecurity,
    FailedLoginLog,
} from "../../models/index.js";

import {
    generateAccessToken,
    generateRefreshToken,
    getAuditRequestContext,
    normalizeEmail,
    normalizeString,
    normalizePhoneNumber,
    resolveId,
} from "../../utils/index.js";
import {
    BadRequestError,
    UnauthenticatedError,
    ForbiddenError
} from "../../errors/index.js";
import { recordAuditLog } from "../audit/index.js";

/**
 * Authenticates a user by email or phone number + password, running every
 * account-security check (locked/banned/suspended) before issuing tokens.
 * Every failure path — unknown identifier, wrong password, locked, banned,
 * suspended — writes a `FailedLoginLog` entry first, then throws; a
 * genuine success resets the account's failed-attempt counter via
 * `security.registerSuccessfulLogin()` and writes both a `LoginLog`
 * ("Login") and an `AuditLog` ("user.login") entry.
 * @param {object} params
 * @param {string} params.identifier - An email (contains "@") or a phone number.
 * @param {string} params.password - The plaintext password to verify.
 * @param {object} [params.requestContext] - Result of `getAuditRequestContext(request)`, spread into every log entry written here.
 * @returns {Promise<{ user: import("mongoose").Document, accessToken: string, refreshToken: string }>}
 * @throws {import("../../errors/index.js").BadRequestError} If `identifier`/`password` is missing, or `identifier` looks like an invalid phone number.
 * @throws {import("../../errors/index.js").UnauthenticatedError} If the identifier doesn't match a user, the password is wrong, or the account is locked.
 * @throws {import("../../errors/index.js").ForbiddenError} If the account is banned or suspended.
 */
const loginService = async({identifier,password, requestContext = {}} = {}) => {
    // GUARD 1: Both fields are required before doing anything else — no
    // database call happens at all if either is missing.
    if(!identifier){
        throw new BadRequestError({
            message: "Enter either email or phoneNumber",
            code: "ENTER_EMAIL_OR_PHONENUMBER"
        })
    }

    if(!password){
        throw new BadRequestError({
            message: "Enter a password",
            code: "ENTER_PASSWORD"
        })
    };

    // A small helper so every "wrong credentials" branch below throws the
    // exact same generic error/message — never revealing WHICH part was wrong.
    const invalidCredentials = () => new UnauthenticatedError({ message: "Invalid credentials" });

    let normalizedEmail, normalizedPhoneNumber;

    // STEP 1: Work out whether `identifier` is an email or a phone number,
    // and normalize it into a comparable form.
    if(identifier.includes("@")){
        // IF it contains "@", treat it as an email.
        normalizedEmail = normalizeEmail(identifier);
    }else{
        // ELSE, try to parse it as a phone number.
        normalizedPhoneNumber = normalizePhoneNumber(normalizeString(identifier), "GH");

        // IF it isn't a valid phone number either, reject immediately —
        // there's no third option, so this identifier is simply malformed.
        if(!normalizedPhoneNumber){
            throw new BadRequestError({
                message: "Enter a valid phone number",
                code: "INVALID_PHONE_NUMBER"
            })
        }
    }

    // STEP 2: Look the user up by whichever field we actually normalized.
    // `normalizedPhoneNumber?.e164` matters here: when the identifier was an
    // email, normalizedPhoneNumber is `undefined` on purpose, and MongoDB
    // treats an undefined-valued field as matching nothing — so this side of
    // the $or never accidentally interferes with the email match.
    const user = await User.findOne({
        $or: [
            {email: normalizedEmail}, {phoneNumber: normalizedPhoneNumber?.e164},
        ],
        isDeleted: false,
    }).select("+password"); // password is select:false by default — opt back in to compare it.

    // Collect ip/userAgent/device info once — every FailedLoginLog/LoginLog/
    // AuditLog write below reuses this same object.
    const context = getAuditRequestContext(requestContext);

    // CHECK 1: Does the identifier even match a real account?
    if(!user){
        await FailedLoginLog.create([{
            identifier,
            reason: "Invalid credentials entered",
            ...context,

        }]);
        throw invalidCredentials();
    }

    const userId = resolveId(user);

    // Fetch (or lazily create) this user's security/lockout record.
    const security = await UserSecurity.findOrCreateForUser(userId);

    // CHECK 2: Is the account currently locked from too many failed attempts?
    // This runs BEFORE the password check, so a locked account never even
    // pays the cost of an Argon2 comparison.
    if (security.isLocked()) {
        await FailedLoginLog.create([{
            userId,
            identifier,
            reason: "Invalid credentials entered",
            ...context,

        }]);
        throw new UnauthenticatedError({ message: "Account temporarily locked due to too many failed attempts", code: "ACCOUNT_LOCKED" });
    }

    // CHECK 3: Does the submitted password actually match the stored hash?
    const passwordMatches = await user.comparePassword(password);

    if (!passwordMatches) {
        // ONLY a wrong password counts toward the lockout counter — being
        // locked/banned/suspended does not, since those aren't "a guess."
        await security.registerFailedAttempt();
        await FailedLoginLog.create([{
            userId,
            identifier,
            reason: "Invalid credentials entered",
            ...context,

        }]);
        throw new UnauthenticatedError({ message: "Invalid email or password", code: "INVALID_CREDENTIALS" });
    }

    // CHECK 4: Is the account banned? Only reachable AFTER a correct
    // password, so an attacker without the password can never learn a
    // given account is banned.
    if (security.isBanned) {
        await FailedLoginLog.create([{
            userId,
            identifier,
            reason: "Invalid credentials entered",
            ...context,

        }]);
        throw new ForbiddenError({ message: "This account has been banned", code: "ACCOUNT_BANNED" });
    }

    // CHECK 5: Is the account temporarily suspended?
    if(security.isSuspended()){
        await FailedLoginLog.create([{
            userId,
            identifier,
            reason: "Invalid credentials entered",
            ...context,

        }]);
        throw new ForbiddenError({
            message: "This account is suspended",
            code: "ACCOUNT_SUSPENDED",
        })

    }

    // Every check passed — this is a genuine, successful login.

    // STEP 3: Issue a fresh access/refresh token pair.
    const accessToken = await generateAccessToken(userId);
    const refreshToken = await generateRefreshToken({
        userId,
        ...context,
    })

    // STEP 4: Reset the failed-attempt counter/lockout, and record this
    // success (LoginLog + the general AuditLog entry).
    await security.registerSuccessfulLogin();
    await LoginLog.create([{
        userId,
        identifier,
        reason: "Login",
        ...context,
    }]);

    await recordAuditLog({
        entityType: "User",
        entityId: userId,
        action: "user.login",
        performedBy: userId,
        ...context,
    });

    return { user, accessToken, refreshToken };
}

export {
    loginService
}
