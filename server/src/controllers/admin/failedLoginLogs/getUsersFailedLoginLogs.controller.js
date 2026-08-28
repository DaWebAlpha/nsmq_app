import { getUsersFailedLoginLogsService } from "../../../services/index.js";
import { sendResponse } from "../../../utils/index.js";

/**
 * GET /admin/failed-login-logs — admin: lists failed-login attempts across
 * all users, paginated and filterable by userId/identifier/ipAddress via the query string.
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 * @returns {import("express").Response}
 */
const getUsersFailedLoginLogsController = async (request, response) => {
    const { page, limit, userId, identifier, ipAddress } = request.query;

    const filter = {};
    if (userId) filter.userId = userId;
    if (identifier) filter.identifier = identifier;
    if (ipAddress) filter.ipAddress = ipAddress;

    const { result } = await getUsersFailedLoginLogsService({ filter, page, limit });

    return sendResponse(
        request,
        response,
        {
            view: "admin/failedLoginLogs/usersFailedLoginLogs",
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

export { getUsersFailedLoginLogsController }
