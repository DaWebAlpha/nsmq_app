import { unbanUserService } from "../../../services/index.js";
import { responseAction } from "../../../utils/index.js";
import { HTTP_STATUS } from "../../../constants/index.js";

/**
 * POST /admin/users/:userId/unban — admin: lifts a ban on a user. Requires
 * `authenticate` to have already run (reads `request.user.userId`).
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 * @returns {import("express").Response}
 */
const unbanUserController = async (request, response) => {
    const { userId } = request.params;
    const unbannedByUserId = request.user.userId;
    const { reason } = request.body;

    const { message } = await unbanUserService({ userId, unbannedByUserId, reason });

    return responseAction(request, response, {
        success: true,
        message,
        redirectTo: `/admin/users/${userId}`,
        status: HTTP_STATUS.OK,
    })
}

export { unbanUserController }
