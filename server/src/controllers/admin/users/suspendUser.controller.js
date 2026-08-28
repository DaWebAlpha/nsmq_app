import { suspendUserService } from "../../../services/index.js";
import { responseAction } from "../../../utils/index.js";
import { HTTP_STATUS } from "../../../constants/index.js";

/**
 * POST /admin/users/:userId/suspend — admin: suspends a user until a given
 * date and revokes their active sessions. Requires `authenticate` to have
 * already run (reads `request.user.userId`).
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 * @returns {import("express").Response}
 */
const suspendUserController = async (request, response) => {
    const { userId } = request.params;
    const suspendedByUserId = request.user.userId;
    const { reason, suspendedUntil } = request.body;

    const { message } = await suspendUserService({ userId, suspendedByUserId, reason, suspendedUntil });

    return responseAction(request, response, {
        success: true,
        message,
        redirectTo: `/admin/users/${userId}`,
        status: HTTP_STATUS.OK,
    })
}

export { suspendUserController }
