import { verifyAccessToken, setAuthCookies, getAuditRequestContext } from "../utils/index.js";
import { refreshSessionService } from "../services/index.js";
import { config } from "../config/index.js";
import { UnauthenticatedError } from "../errors/index.js";
import { User } from "../models/index.js";

/**
 * Verifies an access token and re-fetches the user from the database, so a
 * deleted account loses access immediately rather than waiting for the JWT
 * to naturally expire.
 * @param {string} token - The raw JWT access token.
 * @returns {Promise<{userId: string, role: string}>}
 * @throws {UnauthenticatedError} If the token is invalid/expired or the user no longer exists.
 */
const resolveAuthenticatedUser = async (token) => {
    const decoded = await verifyAccessToken(token);

    const user = await User.findById(decoded.userId).select("role isDeleted");

    if (!user || user.isDeleted) {
        throw new UnauthenticatedError({
            message: "Account no longer exists",
            code: "USER_NOT_FOUND",
        });
    }

    return {
        userId: decoded.userId,
        role: user.role,
    };
};

// Refresh tokens are single-use — refreshSessionService revokes the old one
// on every rotation. If a browser fires more than one request while the
// access token cookie is expired (e.g. two tabs open, or a background
// request landing alongside a page navigation), each request reads the SAME
// still-cookied refresh token before either response's Set-Cookie arrives
// back — only the first to reach the server can actually rotate it; every
// other concurrent caller would try to reuse the now-revoked old token and
// fail, falling through to the 401 despite the session genuinely being fine.
// De-duping in-flight rotations by the raw token value lets every concurrent
// caller share the one real rotation instead of racing it and losing.
const inFlightRefreshes = new Map();

/**
 * Rotates one refresh token into a fresh access+refresh pair, de-duping
 * concurrent callers sharing the same raw token value (see the comment
 * above `inFlightRefreshes`) so only one real rotation happens per token.
 * @param {import("express").Request} request
 * @param {string} refreshToken - The raw refresh token cookie value.
 * @returns {Promise<{accessToken: string, refreshToken: string}>}
 */
const rotateRefreshToken = (request, refreshToken) => {
    if (inFlightRefreshes.has(refreshToken)) {
        return inFlightRefreshes.get(refreshToken);
    }

    const rotation = refreshSessionService({
        rawRefreshToken: refreshToken,
        requestContext: getAuditRequestContext(request),
    }).finally(() => {
        inFlightRefreshes.delete(refreshToken);
    });

    inFlightRefreshes.set(refreshToken, rotation);

    return rotation;
};

/**
 * Rotates the refresh token cookie into a fresh access+refresh pair (same
 * rotation as POST /auth/refresh, de-duped against concurrent callers via
 * rotateRefreshToken) and sets the new cookies on `response`. Used to
 * silently recover from an expired access token instead of forcing the
 * user back to a login screen mid-navigation — a page they clicked should
 * just load, not bounce them out. Any failure here (missing/invalid/expired
 * refresh token, deleted account) is swallowed; the caller treats a `null`
 * return as "really not authenticated."
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 * @returns {Promise<{userId: string, role: string}|null>}
 */
const attemptTokenRefresh = async (request, response) => {
    const refreshToken = request.cookies?.[config.refreshTokenCookie];

    if (!refreshToken) {
        return null;
    }

    try {
        const rotated = await rotateRefreshToken(request, refreshToken);

        setAuthCookies(response, {
            accessToken: rotated.accessToken,
            refreshToken: rotated.refreshToken,
        });

        return await resolveAuthenticatedUser(rotated.accessToken);
    } catch {
        return null;
    }
};

/**
 * Rejects the request with 401 unless a valid access token cookie is
 * present — except when the access token has merely *expired*: in that case
 * it first tries a silent refresh via the refresh token cookie
 * (attemptTokenRefresh) so an expired access token doesn't bounce someone
 * mid-click to a "please log in" page; the request just completes normally
 * against the page they actually asked for. Only a truly dead session
 * (refresh token missing/expired/reused, or malformed/tampered token) falls
 * through to the 401. This is also the one place jwt.js's raw
 * TokenExpiredError/JsonWebTokenError get translated into the app's own
 * UnauthenticatedError shape, so errorHandler.middleware.js sends a clean
 * 401 instead of a generic 500.
 * Sets `request.user = { userId, role }` on success.
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 * @param {import("express").NextFunction} next
 * @returns {Promise<void>}
 */
const authenticate = async (request, response, next) => {
    try {
        const token = request.cookies?.[config.accessTokenCookie];

        if (!token) {
            throw new UnauthenticatedError({
                message: "Authentication required",
                code: "AUTH_REQUIRED",
            });
        }

        request.user = await resolveAuthenticatedUser(token);

        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            const refreshedUser = await attemptTokenRefresh(request, response);

            if (refreshedUser) {
                request.user = refreshedUser;
                return next();
            }

            return next(new UnauthenticatedError({
                message: "Session expired, please log in again",
                code: "SESSION_EXPIRED",
            }));
        }

        if (error.name === "JsonWebTokenError") {
            return next(new UnauthenticatedError({
                message: "Invalid access token",
                code: "INVALID_ACCESS_TOKEN",
            }));
        }

        next(error);
    }
};

export { authenticate, resolveAuthenticatedUser, attemptTokenRefresh };
