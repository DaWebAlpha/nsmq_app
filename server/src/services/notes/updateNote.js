import { Note } from "../../models/index.js";
import { recordAuditLog } from "../audit/index.js";
import { BadRequestError } from "../../errors/index.js";
import {
    withTransaction,
    translateMongooseWriteError,
    pickAllowedFields,
    resolveId,
    fetchOrNotFound,
} from "../../utils/index.js";
import {
    sanitizeNoteContent,
    NOTE_ALLOWED_FIELDS,
    validateSubject,
    normalizeValue,
    findCanonicalTopic,
    findCanonicalSubTopic,
} from "./helpers/index.js";

/**
 * Every editable Note field except `userId` — ownership doesn't
 * change through an edit.
 */
const UPDATE_ALLOWED_FIELDS = NOTE_ALLOWED_FIELDS.filter((field) => field !== "userId");

/**
 * Edits an existing note: mass-assignment-safe field picking, subject
 * validation, content sanitization, and canonical topic/subTopic label
 * reconciliation (excluding the note being edited from its own lookup),
 * inside a transaction alongside the audit-log write.
 * @param {object} params
 * @param {string} params.noteId
 * @param {string} params.updatedByUserId
 * @param {string} [params.reason]
 * @param {object} [params.input={}] - Raw update payload; only UPDATE_ALLOWED_FIELDS are used.
 * @returns {Promise<{note: import("mongoose").Document}>}
 * @throws {BadRequestError} If noteId/updatedByUserId is missing, no fields were provided, or subject is invalid.
 * @throws {NotFoundError} If no active note matches noteId.
 */
const updateNoteService = async({
    noteId,
    updatedByUserId,
    reason,
    input = {},
} = {}) => {
    if(!noteId){
        throw new BadRequestError({
            message: "Note id is required",
            code: "NOTE_ID_REQUIRED",
        });
    }

    if(!updatedByUserId){
        throw new BadRequestError({
            message: "UserId is required",
            code: "USER_ID_REQUIRED",
        });
    }

    const payload = pickAllowedFields(input, UPDATE_ALLOWED_FIELDS);

    if(Object.keys(payload).length === 0){
        throw new BadRequestError({
            message: "No fields to update",
            code: "NO_FIELDS_TO_UPDATE",
        });
    }

    const note = await fetchOrNotFound(Note, noteId, {
        idMessage: "Note id is required",
        idCode: "NOTE_ID_REQUIRED",
        notFoundMessage: "Note not found",
        notFoundCode: "NOTE_NOT_FOUND",
        filter: { isDeleted: false },
    });

    if(payload.subject !== undefined){
        validateSubject(payload.subject);
        payload.subject = normalizeValue(payload.subject);
    }

    if(payload.content !== undefined){
        payload.content = sanitizeNoteContent(payload.content);
    }

    if(payload.subject !== undefined && payload.topicNumber !== undefined){
        const canonicalTopic = await findCanonicalTopic(Note, {
            subject: payload.subject,
            topicNumber: payload.topicNumber,
            excludeNoteId: note._id,
        });

        if(canonicalTopic){
            payload.topic = canonicalTopic;
        }
    }

    if(
        payload.subject !== undefined &&
        payload.topicNumber !== undefined &&
        payload.subTopicNumber !== undefined
    ){
        const canonicalSubTopic = await findCanonicalSubTopic(Note, {
            subject: payload.subject,
            topicNumber: payload.topicNumber,
            subTopicNumber: payload.subTopicNumber,
            excludeNoteId: note._id,
        });

        if(canonicalSubTopic){
            payload.subTopic = canonicalSubTopic;
        }
    }

    return withTransaction(async(session) => {
        Object.assign(note, payload);

        try{
            await note.update({ updatedByUserId, reason, session });
        }catch(error){
            translateMongooseWriteError(error);
        }

        await recordAuditLog({
            entityType: "Note",
            entityId: resolveId(note),
            action: "note.updated",
            performedBy: updatedByUserId,
            session,
        });

        return { note };
    });
};

export { updateNoteService };
