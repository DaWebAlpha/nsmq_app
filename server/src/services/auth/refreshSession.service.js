import {
    verifyRefreshToken,
    generateRefreshToken,
    generateAccessToken,
    getAuditRequestContext
} from "../../utils/index.js";

import { UnauthenticatedError } from "../../errors/index.js";

/**
 * Rotates a refresh token: verifies the current one is still active,
 * revokes it, and issues a fresh access/refresh pair. Revoking the old
 * token before minting a new one means a stolen-and-replayed old token
 * can never be exchanged again once the legitimate client has refreshed.
 * @param {object} params
 * @param {string} params.rawRefreshToken - The raw refresh token from the client's cookie.
 * @param {object} [params.requestContext] - Result of `getAuditRequestContext(request)`, spread into the new `RefreshToken` document's device/IP fields.
 * @returns {Promise<{ userId: import("mongoose").Types.ObjectId, accessToken: string, refreshToken: string }>}
 * @throws {UnauthenticatedError} If `rawRefreshToken` is missing, or doesn't match an active token.
 */
const refreshSessionService = async({ rawRefreshToken, requestContext = {}} = {}) => {
    // GUARD: no token at all — nothing to refresh.
    if(!rawRefreshToken){
        throw new UnauthenticatedError({
            message: "Refresh token is required",
            code: "REFRESH_TOKEN_REQUIRED"
        })
    }

    // Look the token up and confirm it's still active.
    const existingToken = await verifyRefreshToken(rawRefreshToken);

    // IF it's missing, already revoked, or expired — the session is over,
    // the user must log in again from scratch.
    if(!existingToken){
        throw new UnauthenticatedError({
            message: "Session expired, please log in again",
            code: "REFRESH_TOKEN_INVALID"
        });
    }

    // TOKEN ROTATION: kill the old token FIRST, before issuing a new one.
    // If this token was ever stolen, both the real user and the thief would
    // need to refresh — whichever one gets here first "wins," and the other
    // fails, which is itself a signal something is wrong.
    await existingToken.revoke();
    const context = getAuditRequestContext(requestContext);

    // Note the two different id shapes used here:
    // - generateAccessToken needs a plain STRING for the JWT payload, hence .toString().
    // - generateRefreshToken stores it as a real ObjectId in the schema, so
    //   the raw (non-stringified) value is passed through unchanged.
    const accessToken = await generateAccessToken(existingToken.userId.toString());
    const refreshToken = await generateRefreshToken({
        userId: existingToken.userId,
        ...context,
    });

    return { userId: existingToken.userId, accessToken, refreshToken };
};

export { refreshSessionService };
