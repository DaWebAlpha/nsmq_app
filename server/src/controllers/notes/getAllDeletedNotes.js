import { getAllDeletedNotesService } from "../../services/index.js";
import { sendResponse } from "../../utils/index.js";

/**
 * GET /notes/deleted — lists soft-deleted notes, paginated/filterable via
 * the query string. Admin "trash" view.
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 * @returns {import("express").Response}
 */
const getAllDeletedNotesController = async (request, response) => {
    const sortOrder = Number(request.query.sortOrder) || -1;

    const { data, limit, page, total, totalPages, hasNextPage, hasPreviousPage } = await getAllDeletedNotesService({ sortOrder, filter: request.query });
    return sendResponse(
        request,
        response,
        {
            view: "notes/deletedNotes",
            data: {
                data,
                limit,
                page,
                total,
                totalPages,
                hasNextPage,
                hasPreviousPage,
            },
            jsonData: {
                success: true,
            },
        }
    )
}

export { getAllDeletedNotesController }