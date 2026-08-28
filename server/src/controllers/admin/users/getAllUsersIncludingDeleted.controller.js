import { getAllUsersIncludingDeletedService } from "../../../services/index.js";
import { sendResponse } from "../../../utils/index.js";

/**
 * GET /admin/users — admin: lists every user, active and deleted, paginated
 * and filterable by role/search via the query string.
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 * @returns {import("express").Response}
 */
const getAllUsersIncludingDeletedController = async (request, response) => {
    const { role, search, page, limit } = request.query;

    const { result } = await getAllUsersIncludingDeletedService({ role, search, page, limit });

    return sendResponse(
        request,
        response,
        {
            view: "admin/users/allUsers",
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

export { getAllUsersIncludingDeletedController }
