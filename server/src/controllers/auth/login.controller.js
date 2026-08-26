import { loginService} from "../../services/index.js";
import {
    getAuditRequestContext,
    setAuthCookies,
    getPostAuthRedirect,
    responseAction,
} from "../../utils/index.js";
import { HTTP_STATUS } from "../../constants/index.js";

/**
 * POST /auth/login — authenticates by identifier + password, sets fresh
 * access/refresh cookies on success, and responds via `responseAction`.
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 * @returns {Promise<void>}
 */
const loginController = async(request, response) => {
    const {user, accessToken, refreshToken} = await loginService({
        identifier: request.body.identifier,
        password: request.body.password,
        requestContext: getAuditRequestContext(request)
    })

    setAuthCookies(
        response,
        {
            accessToken,
            refreshToken
        }
    )

    return responseAction(
        request,
        response,
        {
            success: true,
            message: `Welcome back ${user.fullName}`,
            redirectTo: getPostAuthRedirect(user),
            status: HTTP_STATUS.OK
        }
    )
}

export {
    loginController
}
