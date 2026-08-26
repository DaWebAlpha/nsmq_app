import { registerUserService } from "../../services/index.js";
import { asyncHandler, getAuditRequestContext, responseAction, setAuthCookies, getPostAuthRedirect } from "../../utils/index.js";
import { HTTP_STATUS } from "../../constants/index.js";

/**
 * POST /auth/register — creates a new account, logs it in immediately
 * (sets access/refresh cookies), and responds via `responseAction` (JSON
 * for API clients, a redirect to the post-auth destination for browsers).
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 * @returns {Promise<void>}
 */
const registerUserController = async(request, response) => {
    const { user, accessToken,refreshToken } = await registerUserService({
        input: request.body,
        requestContext: getAuditRequestContext(request),
    });

    setAuthCookies(
        response,
        {
            accessToken,
            refreshToken
        }
    );

    return responseAction(
        request,
        response,
        {
            success: true,
            message: `Welcome, ${user.fullName}`,
            redirectTo: getPostAuthRedirect(user),
            status: HTTP_STATUS.CREATED
        }
    )
}

export {
    registerUserController
}
