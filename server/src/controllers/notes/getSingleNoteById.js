import { getSingleNoteByIdService } from "../../services/index.js";
import { sendResponse } from "../../utils/index.js";

/**
 * GET /notes/:noteId — fetches one active note by id.
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 * @returns {import("express").Response}
 */
const getSingleNoteByIdController = async (request, response) => {
    const { noteId } = request.params;

    const { note } = await getSingleNoteByIdService({ noteId });

    return sendResponse(
        request,
        response,
        {
            view: "notes/singleNote",
            data: {
                note,
            },
            jsonData: {
                success: true,
            }
        }
    )
}

export { getSingleNoteByIdController }
