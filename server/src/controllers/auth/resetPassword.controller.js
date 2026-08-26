import { resetPasswordService } from "../../services/index.js";
import { getAuditRequestContext, responseAction } from "../../utils/index.js";

/**
 * POST /auth/reset-password — consumes a password-reset token (from the
 * emailed link) and sets a new password. Every active session is revoked
 * by the service, so this deliberately does NOT log the user back in —
 * they're sent to the login page to sign in fresh with the new password.
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 * @returns {Promise<void>}
 */
const resetPasswordController = async (request, response) => {
    await resetPasswordService({
        token: request.body.token,
        newPassword: request.body.newPassword,
        requestContext: getAuditRequestContext(request),
    });

    return responseAction(request, response, {
        success: true,
        message: "Password reset successfully. Please log in with your new password.",
        redirectTo: "/auth/login",
    });
};

export {
    resetPasswordController,
}
