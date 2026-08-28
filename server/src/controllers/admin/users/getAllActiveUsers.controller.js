import { getAllActiveUsersService } from "../../../services/index.js";
import { sendResponse } from "../../../utils/index.js";

/**
 * GET /admin/users/active — admin: lists non-deleted users, paginated and
 * filterable by role/search via the query string.
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 * @returns {import("express").Response}
 */
const getAllActiveUsersController = async (request, response) => {
    const { role, search, page, limit } = request.query;

    const { result } = await getAllActiveUsersService({ role, search, page, limit });

    return sendResponse(
        request,
        response,
        {
            view: "admin/users/activeUsers",
            data: {
                users: result.data,
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

export { getAllActiveUsersController }
