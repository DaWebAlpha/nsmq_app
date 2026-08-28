import { updateUserRoleService } from "../../../services/index.js";
import { responseAction } from "../../../utils/index.js";
import { HTTP_STATUS } from "../../../constants/index.js";

/**
 * PATCH /admin/users/:userId/role — admin: changes a user's role. Requires
 * `authenticate` to have already run (reads `request.user.userId`).
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 * @returns {import("express").Response}
 */
const updateUserRoleController = async (request, response) => {
    const { userId } = request.params;
    const updatedByUserId = request.user.userId;
    const { role } = request.body;

    const { message } = await updateUserRoleService({ userId, role, updatedByUserId });

    return responseAction(request, response, {
        success: true,
        message,
        redirectTo: `/admin/users/${userId}`,
        status: HTTP_STATUS.OK,
    })
}

export { updateUserRoleController }
