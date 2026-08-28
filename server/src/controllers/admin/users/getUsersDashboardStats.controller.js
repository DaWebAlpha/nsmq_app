import { getUsersDashboardStatsService } from "../../../services/index.js";
import { sendResponse } from "../../../utils/index.js";

/**
 * GET /admin/users/dashboard-stats — admin: active/total/deleted user counts.
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 * @returns {import("express").Response}
 */
const getUsersDashboardStatsController = async (request, response) => {
    const { totalActiveUsers, totalUsers, totalDeletedUsers } = await getUsersDashboardStatsService();

    return sendResponse(
        request,
        response,
        {
            view: "admin/users/dashboardStats",
            data: {
                totalActiveUsers,
                totalUsers,
                totalDeletedUsers,
            },
            jsonData: {
                success: true,
            }
        }
    )
}

export { getUsersDashboardStatsController }
