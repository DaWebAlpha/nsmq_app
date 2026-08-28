import { Note } from "../../models/index.js";
import {
    BadRequestError,
} from "../../errors/index.js";
import {
    withTransaction,
    fetchOrNotFound,
} from "../../utils/index.js";
import { recordAuditLog } from "../audit/recordAuditLog.service.js";

/**
 * Soft-deletes one note, inside a transaction alongside the audit-log write.
 * @param {object} params
 * @param {string} params.noteId
 * @param {string} params.deletedByUserId
 * @param {string} [params.reason]
 * @returns {Promise<{note: import("mongoose").Document}>}
 * @throws {BadRequestError} If noteId or deletedByUserId is missing.
 * @throws {NotFoundError} If no active note matches noteId.
 */
const deleteSingleNoteByUserService = async({
    noteId,
    deletedByUserId,
    reason,
} = {}) => {

    if(!noteId){
       throw new BadRequestError({
            message: "NoteId is required",
            code: "NOTE_ID_REQUIRED",
        }) 
    }

    if(!deletedByUserId){
        throw new BadRequestError({
            message: "UserId is required",
            code: "USER_ID_REQUIRED",
        })
    }

    const note = await fetchOrNotFound(
        Note,
        noteId,
        {
            idMessage: "Note id is required",
            idCode: "NOTE_ID_REQUIRED",
            notFoundMessage: "Resource not found",
            notFoundCode: "NOT_FOUND",
        }
    )

    return withTransaction(async(session) => {
        try{
            await note.softDelete({
                deletedByUserId,
                reason,
                session
            })
        }catch(error){
            throw error;
        }

        
        await recordAuditLog({
            entityType: "Note",
            entityId: note._id,
            action: "note.deleted",
            performedBy: deletedByUserId,
            session
        })

        return { note }
    })
    
}

export {
    deleteSingleNoteByUserService,
}