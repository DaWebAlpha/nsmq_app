import { forgotPasswordService } from "../../services/index.js";
import { responseAction } from "../../utils/index.js";

/**
 * POST /auth/forgot-password — requests a password-reset email.
 * forgotPasswordService deliberately never reveals whether the given email
 * actually matches an account (that's what prevents email enumeration), so
 * this controller always sends back the exact same message regardless of
 * what happened inside the service.
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 * @returns {Promise<void>}
 */
const forgotPasswordController = async (request, response) => {
    await forgotPasswordService({
        email: request.body.email,
        baseUrl: `${request.protocol}://${request.get("host")}`,
    });

    return responseAction(request, response, {
        success: true,
        message: "If that email is registered, a password reset link has been sent.",
        redirectTo: "/auth/login",
    });
};

export {
    forgotPasswordController,
}
