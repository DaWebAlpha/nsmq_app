import { Note } from "../../models/index.js";
import {
    withTransaction,
    fetchOrNotFound
} from "../../utils/index.js";
import {
    BadRequestError,

} from "../../errors/index.js";
import { recordAuditLog } from "../audit/recordAuditLog.service.js";

/**
 * Restores one soft-deleted note, inside a transaction alongside the audit-log write.
 * @param {object} params
 * @param {string} params.noteId
 * @param {string} params.restoredByUserId
 * @param {string} [params.reason]
 * @returns {Promise<{note: import("mongoose").Document}>}
 * @throws {BadRequestError} If noteId or restoredByUserId is missing.
 * @throws {NotFoundError} If no note matches noteId.
 */
const restoreSingleNoteByUserService = async({
    noteId,
    restoredByUserId,
    reason,
} = {}) => {


    if(!noteId){
        throw new BadRequestError({
            message: "Note id is required",
            code: "NOTE_ID_REQUIRED",
        })
    }
    if(!restoredByUserId){
        throw new BadRequestError({
            message: "Restore User id required", 
            code: "RESTORE_USER_ID_REQUIRED"
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
    );


    return withTransaction(async(session) => {

        try{
            await note.restore({
                restoredByUserId,
                reason,
                session
            })
        }catch(error){
            throw error;
        }

        await recordAuditLog({
            entityType: "Note",
            entityId: note._id,
            action: "note.restored",
            performedBy: restoredByUserId,
            session
        })

        return { note };
    })


}

export {
    restoreSingleNoteByUserService
}