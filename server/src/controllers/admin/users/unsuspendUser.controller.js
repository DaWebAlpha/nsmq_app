import { unsuspendUserService } from "../../../services/index.js";
import { responseAction } from "../../../utils/index.js";
import { HTTP_STATUS } from "../../../constants/index.js";

/**
 * POST /admin/users/:userId/unsuspend — admin: lifts a suspension on a
 * user. Requires `authenticate` to have already run (reads `request.user.userId`).
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 * @returns {import("express").Response}
 */
const unsuspendUserController = async (request, response) => {
    const { userId } = request.params;
    const unsuspendedByUserId = request.user.userId;
    const { reason } = request.body;

    const { message } = await unsuspendUserService({ userId, unsuspendedByUserId, reason });

    return responseAction(request, response, {
        success: true,
        message,
        redirectTo: `/admin/users/${userId}`,
        status: HTTP_STATUS.OK,
    })
}

export { unsuspendUserController }
