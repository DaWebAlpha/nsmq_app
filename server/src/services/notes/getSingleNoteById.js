import { Note } from "../../models/index.js";
import { fetchOrNotFound } from "../../utils/index.js";

/**
 * Fetches one active note by id, or throws NotFoundError (a soft-deleted
 * note is treated the same as a missing one here).
 * @param {object} params
 * @param {string} params.noteId
 * @returns {Promise<{note: import("mongoose").Document}>}
 * @throws {BadRequestError} If noteId is missing.
 * @throws {NotFoundError} If no active note matches.
 */
const getSingleNoteByIdService = async({ noteId } = {}) => {
    const note = await fetchOrNotFound(Note, noteId, {
        idMessage: "Note id is required",
        idCode: "NOTE_ID_REQUIRED",
        notFoundMessage: "Note not found",
        notFoundCode: "NOTE_NOT_FOUND",
        filter: { isDeleted: false },
    });

    return { note };
};

export { getSingleNoteByIdService };
