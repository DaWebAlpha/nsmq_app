import { changePasswordService } from "../../services/index.js";
import {
    getAuditRequestContext,
    responseAction,
    REFRESH_TOKEN_COOKIE,
} from "../../utils/index.js";

/**
 * POST /auth/me/password — changes the logged-in user's own password after
 * re-verifying their current one. Passes along the request's own refresh
 * token so changePasswordService can spare THIS session from the mass
 * revocation it does on every other active session.
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 * @returns {Promise<void>}
 */
const changePasswordController = async (request, response) => {
    await changePasswordService({
        userId: request.user.userId,
        currentPassword: request.body.currentPassword,
        newPassword: request.body.newPassword,
        currentRawRefreshToken: request.cookies?.[REFRESH_TOKEN_COOKIE] ?? null,
        requestContext: getAuditRequestContext(request),
    });

    return responseAction(request, response, {
        success: true,
        message: "Password changed successfully",
        redirectTo: "/auth/me",
    });
};

export {
    changePasswordController,
}
