import { getUserLoginLogsService } from "../../../services/index.js";
import { sendResponse } from "../../../utils/index.js";

/**
 * GET /admin/login-logs/:userId — admin: lists successful-login logs for one user, paginated.
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 * @returns {import("express").Response}
 */
const getUserLoginLogsController = async (request, response) => {
    const { userId } = request.params;
    const { page, limit } = request.query;

    const { result } = await getUserLoginLogsService({ userId, page, limit });

    return sendResponse(
        request,
        response,
        {
            view: "admin/loginLogs/userLoginLogs",
            data: {
                loginLogs: result.data,
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

export { getUserLoginLogsController }
