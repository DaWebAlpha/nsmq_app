import { restoreUserService } from "../../../services/index.js";
import { responseAction } from "../../../utils/index.js";
import { HTTP_STATUS } from "../../../constants/index.js";

/**
 * POST /admin/users/:userId/restore — admin: restores a soft-deleted user
 * account. Requires `authenticate` to have already run (reads `request.user.userId`).
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 * @returns {import("express").Response}
 */
const restoreUserController = async (request, response) => {
    const { userId } = request.params;
    const restoredByUserId = request.user.userId;
    const { reason } = request.body;

    const { message } = await restoreUserService({ userId, restoredByUserId, reason });

    return responseAction(request, response, {
        success: true,
        message,
        redirectTo: "/admin/users",
        status: HTTP_STATUS.OK,
    })
}

export { restoreUserController }
