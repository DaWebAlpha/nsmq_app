import { deleteUserService } from "../../../services/index.js";
import { responseAction } from "../../../utils/index.js";
import { HTTP_STATUS } from "../../../constants/index.js";

/**
 * DELETE /admin/users/:userId — admin: soft-deletes a user account.
 * Requires `authenticate` to have already run (reads `request.user.userId`).
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 * @returns {import("express").Response}
 */
const deleteUserController = async (request, response) => {
    const { userId } = request.params;
    const deletedByUserId = request.user.userId;
    const { reason } = request.body;

    const { message } = await deleteUserService({ userId, deletedByUserId, reason });

    return responseAction(request, response, {
        success: true,
        message,
        redirectTo: "/admin/users",
        status: HTTP_STATUS.OK,
    })
}

export { deleteUserController }
