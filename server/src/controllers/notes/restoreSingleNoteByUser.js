import { restoreSingleNoteByUserService } from "../../services/index.js";
import { sendResponse } from "../../utils/index.js";

/**
 * POST /notes/:noteId/restore — restores a soft-deleted note. Requires
 * `authenticate` to have already run (reads `request.user.userId`).
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 * @returns {import("express").Response}
 */
const restoreSingleNoteByUserController = async (request, response) => {
    const { noteId } = request.params;
    const restoredByUserId = request.user.userId;
    const { reason } = request.body;

    const { note } = await restoreSingleNoteByUserService({ noteId, restoredByUserId, reason });

    return sendResponse(
        request,
        response,
        {
            view: "notes/noteRestored",
            data: {
                note,
            },
            jsonData: {
                success: true,
            }
        }
    )
}

export { restoreSingleNoteByUserController }
