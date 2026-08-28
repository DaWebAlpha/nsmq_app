import { getAllActiceSpecificSubjectService } from "../../services/index.js";
import { sendResponse } from "../../utils/index.js";

/**
 * GET /notes/subject/:subject — lists active notes for one subject, paginated.
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 * @returns {import("express").Response}
 */
const getAllActiceSpecificSubjectController = async (request, response) => {
    const sortOrder = Number(request.query.sortOrder) || -1;
    const { subject } = request.params;

    const { data, page, limit, total, totalPages, hasNextPage, hasPreviousPage } = await getAllActiceSpecificSubjectService({ subject, sortOrder });

    return sendResponse(
        request,
        response,
        {
            view: "notes/subjectNotes",
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

export { getAllActiceSpecificSubjectController }
