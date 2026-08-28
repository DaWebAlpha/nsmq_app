import { getUsersLoginLogsService } from "../../../services/index.js";
import { sendResponse } from "../../../utils/index.js";

/**
 * GET /admin/login-logs — admin: lists successful-login logs across all
 * users, paginated and filterable by userId/identifier/ipAddress via the query string.
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 * @returns {import("express").Response}
 */
const getUsersLoginLogsController = async (request, response) => {
    const { page, limit, userId, identifier, ipAddress } = request.query;

    const filter = {};
    if (userId) filter.userId = userId;
    if (identifier) filter.identifier = identifier;
    if (ipAddress) filter.ipAddress = ipAddress;

    const { result } = await getUsersLoginLogsService({ filter, page, limit });

    return sendResponse(
        request,
        response,
        {
            view: "admin/loginLogs/usersLoginLogs",
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

export { getUsersLoginLogsController }
