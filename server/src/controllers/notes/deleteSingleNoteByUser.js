import { deleteSingleNoteByUserService } from "../../services/index.js";
import { sendResponse } from "../../utils/index.js";

/**
 * DELETE /notes/:noteId — soft-deletes a note. Requires `authenticate` to
 * have already run (reads `request.user.userId`).
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 * @returns {import("express").Response}
 */
const deleteSingleNoteByUserController = async (request, response) => {
    const { noteId } = request.params;
    const deletedByUserId = request.user.userId;
    const { reason } = request.body;

    const { note } = await deleteSingleNoteByUserService({ noteId, deletedByUserId, reason });

    return sendResponse(
        request,
        response,
        {
            view: "notes/noteDeleted",
            data: {
                note,
            },
            jsonData: {
                success: true,
            }
        }
    )
}

export { deleteSingleNoteByUserController }
