import { logoutService } from "../../services/index.js";
import { asyncHandler, responseAction, clearAuthCookies, REFRESH_TOKEN_COOKIE } from "../../utils/index.js";
import { HTTP_STATUS } from "../../constants/index.js";

/**
 * POST /auth/logout — revokes the current refresh token (if any) and
 * clears both auth cookies. Always responds as a success, regardless of
 * whether there was an active session to actually end.
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 * @returns {Promise<void>}
 */
const logoutController = async(request, response) => {
   await logoutService({rawRefreshToken: request.cookies?.[REFRESH_TOKEN_COOKIE]});

   clearAuthCookies(response);

   return responseAction(request, response, {
        success: true,
        message: "Logged out successfully",
        redirectTo: "/auth/login",
        status: HTTP_STATUS.OK,
   })
}

export {
    logoutController,
}
