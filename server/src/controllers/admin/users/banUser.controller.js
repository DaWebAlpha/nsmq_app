import { banUserService } from "../../../services/index.js";
import { responseAction } from "../../../utils/index.js";
import { HTTP_STATUS } from "../../../constants/index.js";

/**
 * POST /admin/users/:userId/ban — admin: bans a user and revokes all their
 * active sessions. Requires `authenticate` to have already run (reads `request.user.userId`).
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 * @returns {import("express").Response}
 */
const banUserController = async (request, response) => {
    const { userId } = request.params;
    const bannedByUserId = request.user.userId;
    const { reason } = request.body;

    const { message } = await banUserService({ userId, bannedByUserId, reason });

    return responseAction(request, response, {
        success: true,
        message,
        redirectTo: `/admin/users/${userId}`,
        status: HTTP_STATUS.OK,
    })
}

export { banUserController }
