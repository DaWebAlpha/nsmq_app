import { getAllDeletedUsersService } from "../../../services/index.js";
import { sendResponse } from "../../../utils/index.js";

/**
 * GET /admin/users/deleted — admin: lists soft-deleted users, paginated and
 * filterable by role/search via the query string.
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 * @returns {import("express").Response}
 */
const getAllDeletedUsersController = async (request, response) => {
    const { role, search, page, limit } = request.query;

    const { result } = await getAllDeletedUsersService({ role, search, page, limit });

    return sendResponse(
        request,
        response,
        {
            view: "admin/users/deletedUsers",
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

export { getAllDeletedUsersController }
