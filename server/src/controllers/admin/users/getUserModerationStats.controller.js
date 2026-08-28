import { getUserModerationStatsService } from "../../../services/index.js";
import { sendResponse } from "../../../utils/index.js";

/**
 * GET /admin/users/moderation-stats — admin: counts of currently banned and
 * currently suspended users.
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 * @returns {import("express").Response}
 */
const getUserModerationStatsController = async (request, response) => {
    const { bannedCount, suspendedCount } = await getUserModerationStatsService();

    return sendResponse(
        request,
        response,
        {
            view: "admin/users/moderationStats",
            data: {
                bannedCount,
                suspendedCount,
            },
            jsonData: {
                success: true,
            }
        }
    )
}

export { getUserModerationStatsController }
