import { getAllActiveNotesService } from "../../services/index.js";
import { sendResponse } from "../../utils/index.js";


/**
 * GET /notes/active — lists active (non-deleted) notes, paginated/filterable
 * via the query string.
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 * @returns {import("express").Response}
 */
const getAllActiveNotesController = async(request, response) => {
    const sortOrder = Number(request.query.sortOrder) || -1;

    const { data, page, limit, total, totalPages, hasNextPage, hasPreviousPage } = await getAllActiveNotesService({ sortOrder, filter: request.query });

    return sendResponse(
        request,
        response,
        {
            view: "notes/activeNotes",
            data: {
                data,
                page,
                limit,
                total,
                totalPages,
                hasNextPage,
                hasPreviousPage
            }
        }
    )
}


export {
    getAllActiveNotesController,
}