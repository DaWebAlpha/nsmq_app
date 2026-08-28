import { getAllNotesService } from "../../services/index.js";
import { sendResponse } from "../../utils/index.js";


/**
 * GET /notes — lists every note, active and deleted, paginated/filterable
 * via the query string.
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 * @returns {import("express").Response}
 */
const getAllNotesController = async (request, response) => {
    const sortOrder = Number(request.query.sortOrder) || -1;

    const {data, page, limit, total, totalPages, hasNextPage, hasPreviousPage} = await getAllNotesService({ sortOrder, filter: request.query });

    return sendResponse(
        request,
        response,
        {
            view: "notes/allnotes",
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

export { getAllNotesController }
