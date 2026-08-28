import { getUserFailedLoginLogsService } from "../../../services/index.js";
import { sendResponse } from "../../../utils/index.js";

/**
 * GET /admin/failed-login-logs/:userId — admin: lists failed-login attempts
 * for one user, paginated.
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 * @returns {import("express").Response}
 */
const getUserFailedLoginLogsController = async (request, response) => {
    const { userId } = request.params;
    const { page, limit } = request.query;

    const { result } = await getUserFailedLoginLogsService({ userId, page, limit });

    return sendResponse(
        request,
        response,
        {
            view: "admin/failedLoginLogs/userFailedLoginLogs",
            data: {
                failedLoginLogs: result.data,
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: result.totalPages,
                hasNextPage: result.hasNextPage,
                hasPreviousPage: result.hasPreviousPage,
            },
            jsonData: {
                success: true,
            }
        }
    )
}

export { getUserFailedLoginLogsController }
