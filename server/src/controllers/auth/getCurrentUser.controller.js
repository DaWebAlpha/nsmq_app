import { getCurrentUserService } from "../../services/index.js";
import { sendResponse } from "../../utils/index.js";
import { HTTP_STATUS } from "../../constants/index.js";

/**
 * GET /auth/me — the logged-in user's own profile + security state.
 * Requires `authenticate` to have already run (reads `request.user.userId`).
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 * @returns {import("express").Response}
 */
const getCurrentUserController = async(request, response) => {
    const { user, security } = await getCurrentUserService({
        userId: request.user.userId
    })

    return sendResponse(
        request,
        response,
        {
            statusCode: HTTP_STATUS.OK,
            view: "pages/me",
            data: {
                title: "My Profile",
                currentUser: request.user,
                user: user.toObject(),
                security: security ? security.toObject() : null,
            }
        }
    )
}

export {
    getCurrentUserController,
}
