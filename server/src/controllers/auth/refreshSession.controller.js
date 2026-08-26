import { refreshSessionService } from "../../services/index.js";
import {
    getAuditRequestContext,
    setAuthCookies,
    responseAction,
    REFRESH_TOKEN_COOKIE,
} from "../../utils/index.js";

/**
 * POST /auth/refresh — trades the caller's current refresh-token cookie for
 * a brand-new access/refresh pair (token rotation: the old refresh token is
 * revoked the moment this runs). Typically called silently by a client-side
 * fetch interceptor when an access token has expired, not as a page navigation.
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 * @returns {Promise<void>}
 */
const refreshSessionController = async (request, response) => {
    const { accessToken, refreshToken } = await refreshSessionService({
        rawRefreshToken: request.cookies?.[REFRESH_TOKEN_COOKIE],
        requestContext: getAuditRequestContext(request),
    });

    setAuthCookies(response, { accessToken, refreshToken });

    return responseAction(request, response, {
        success: true,
        message: "Session refreshed",
        redirectTo: "/",
    });
};

export {
    refreshSessionController,
}
