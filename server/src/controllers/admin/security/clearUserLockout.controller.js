import { clearUserLockoutService } from "../../../services/index.js";
import { responseAction } from "../../../utils/index.js";
import { HTTP_STATUS } from "../../../constants/index.js";

/**
 * POST /admin/security/:userId/clear-lockout — admin: resets a user's
 * failed-login count and lifts any active lockout. Requires `authenticate`
 * to have already run (reads `request.user.userId`).
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 * @returns {import("express").Response}
 */
const clearUserLockoutController = async (request, response) => {
    const { userId } = request.params;
    const clearedByUserId = request.user.userId;

    const { message } = await clearUserLockoutService({ userId, clearedByUserId });

    return responseAction(request, response, {
        success: true,
        message,
        redirectTo: `/admin/security/${userId}`,
        status: HTTP_STATUS.OK,
    })
}

export { clearUserLockoutController }
