import { updateNoteService } from "../../services/index.js";
import { sendResponse } from "../../utils/index.js";

/**
 * PATCH /notes/:noteId — edits an existing note. Requires `authenticate`
 * to have already run (reads `request.user.userId`).
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 * @returns {import("express").Response}
 */
const updateNoteController = async (request, response) => {
    const { noteId } = request.params;
    const updatedByUserId = request.user.userId;
    const { reason, ...input } = request.body;

    const { note } = await updateNoteService({ noteId, updatedByUserId, reason, input });

    return sendResponse(
        request,
        response,
        {
            view: "notes/noteUpdated",
            data: {
                note,
            },
            jsonData: {
                success: true,
            }
        }
    )
}

export { updateNoteController }
