import { getAllActiveNotesCreatedByUserService } from "../../services/index.js";
import { sendResponse } from "../../utils/index.js";

/**
 * GET /notes/mine/active — lists the logged-in user's own active notes, paginated.
 * Requires `authenticate` to have already run (reads `request.user.userId`).
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 * @returns {import("express").Response}
 */
const getAllActiveNotesCreatedByUserController = async (request, response) => {
    const sortOrder = Number(request.query.sortOrder) || -1;
    const userId = request.user.userId;

    const { data, page, limit, total, totalPages, hasNextPage, hasPreviousPage } = await getAllActiveNotesCreatedByUserService({ userId, sortOrder });

    return sendResponse(
        request,
        response,
        {
            view: "notes/myActiveNotes",
            data: {
                data,
                page,
                limit,
                total,
                totalPages,
                hasNextPage,
                hasPreviousPage,
            },
            jsonData: {
                success: true,
            }
        }
    )
}

export { getAllActiveNotesCreatedByUserController }
