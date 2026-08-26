import jwt from "jsonwebtoken";
import {
    BadRequestError
} from "../errors/index.js";
import {
    normalizeString
} from "./normalizer.js";
import { config } from "../config/index.js";

/**
 * Signs a short-lived JWT access token carrying only the user's id.
 * The token is self-contained and stateless — verifying it later never
 * needs a database lookup to confirm the signature is genuine (though
 * `authenticate` middleware still re-checks the user exists/isn't
 * deleted on every request, since this token alone can't know that).
 * @param {string|import("mongoose").Types.ObjectId} userId - The user's id; stringified before signing.
 * @returns {Promise<string>} The signed JWT, valid for config.jwtAccessExpirySeconds.
 * @throws {BadRequestError} If userId is missing/empty after normalization.
 */
const generateAccessToken = async (userId) => {

    // `normalizeString` only accepts an actual JS string — passing a raw
    // Mongoose ObjectId here (instead of calling `.toString()` first)
    // silently returns "", tripping the guard below. This is why every
    // service calling this function stringifies the id first.
    const normalizedUserId = normalizeString(userId);

    if(!normalizedUserId){
        throw new BadRequestError({
            message: "User id is required",
            code: "USER_ID_REQUIRED",
        })
    }

    // Sign a token whose payload is JUST the user's id — nothing else
    // (no role, no email) is embedded, keeping the token small and meaning
    // every permission check still has to consult the database.
    return jwt.sign(
        {userId: normalizedUserId},
        config.jwtAccessSecret,
        {expiresIn: config.jwtAccessExpirySeconds},
    )
}

/**
 * Verifies a JWT access token's signature and expiry, returning its
 * decoded payload. Throws jsonwebtoken's own error types
 * (TokenExpiredError, JsonWebTokenError) on an invalid/expired token —
 * `authenticate` middleware is what translates those into clean
 * UnauthenticatedError responses.
 * @param {string} token - The raw JWT to verify.
 * @returns {Promise<{userId: string, iat: number, exp: number}>} The decoded token payload.
 * @throws {BadRequestError} If token isn't a non-empty string.
 */
const verifyAccessToken = async (token) => {

    // GUARD: reject an obviously-empty/non-string token before ever
    // calling into the `jsonwebtoken` library.
    if (
            typeof token !== "string" ||
            token.trim() === ""
    ) {
        throw new BadRequestError({
            message: "Access token is required to verify",
            code: "ACCESS_TOKEN_REQUIRED",
        });
    }

    const normalizedToken = token.trim();

    // `jwt.verify` checks BOTH the signature (was this actually signed by
    // US, with our secret?) AND the expiry, throwing jsonwebtoken's own
    // error types (TokenExpiredError/JsonWebTokenError) if either fails —
    // this function doesn't catch those; the `authenticate` middleware
    // upstream is what turns them into a clean UnauthenticatedError.
    return jwt.verify(normalizedToken, config.jwtAccessSecret);
}

export {
    generateAccessToken,
    verifyAccessToken
}
