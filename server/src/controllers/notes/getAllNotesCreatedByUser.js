import { getAllNotesCreatedByUserService } from "../../services/index.js";
import { sendResponse } from "../../utils/index.js";

/**
 * GET /notes/mine — lists every note (active and deleted) the logged-in
 * user created, paginated. Requires `authenticate` to have already run
 * (reads `request.user.userId`).
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 * @returns {import("express").Response}
 */
const getAllNotesCreatedByUserController = async (request, response) => {
    const sortOrder = Number(request.query.sortOrder) || -1;
    const userId = request.user.userId;

    const { data, page, limit, total, totalPages, hasNextPage, hasPreviousPage } = await getAllNotesCreatedByUserService({ userId, sortOrder });

    return sendResponse(
        request,
        response,
        {
            view: "notes/myNotes",
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

export { getAllNotesCreatedByUserController }
