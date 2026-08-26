/** Barrel export for shared utility helpers. */
export { asyncHandler } from "./asyncHandler.js";
export { sendResponse } from "./sendResponse.js";

export {
    normalizeString,
    toTitleCase,
    normalizeEmail,
    normalizeText,
} from "./normalizer.js";

export { normalizePhoneNumber } from "./phone.js";

export {
    hashPassword,
    verifyPassword
} from "./password.argon2.js";

export { gracefulShutdown } from "./gracefulShutdown.js";

export { withTransaction, isTransientTransactionError } from "./withTransaction.js";

export { translateMongooseWriteError } from "./translateMongooseWriteError.js";

export {
     generateAccessToken,
     verifyAccessToken
} from "./jwt.js";


export {
    generateRefreshToken,
    verifyRefreshToken,
    hashToken,
} from "./refreshTokenUtils.js";

export {
    getAuditRequestContext
} from "./getAuditRequestContext.js";

export {
    getClientIP,
    getUserAgent,
    getDeviceName,
    getDeviceId,
} from "./request.js";

export {fetchOrNotFound } from "./fetchOrNotFound.js"

export {
    hashResetToken,
    generateResetToken,
} from "./passwordResetTokenUtils.js";

export { sendPasswordResetEmail } from "./mailer.js";

export {
    computePaidUntil,
    isPaidActive,
    resolvePaidAccess,
} from "./paidAccess.js";

export {
    setAuthCookies,
    clearAuthCookies,
    ACCESS_TOKEN_COOKIE,
    REFRESH_TOKEN_COOKIE,
} from "./authCookies.js";

export { responseAction } from "./responseAction.js";

export { getPostAuthRedirect } from "./postAuthRedirectTo.js";
