import { Note } from "../../models/index.js";
import { recordAuditLog } from "../audit/index.js";
import {
    withTransaction,
    translateMongooseWriteError,
    pickAllowedFields,
    resolveId,
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
 * Creates a note: mass-assignment-safe field picking, subject validation,
 * content sanitization, and canonical topic/subTopic label reconciliation,
 * all inside a transaction alongside the audit-log write.
 * @param {object} params
 * @param {object} [params.input={}] - Raw create payload; only NOTE_ALLOWED_FIELDS are used.
 * @returns {Promise<{note: import("mongoose").Document}>}
 * @throws {BadRequestError} If subject is invalid, or content exceeds the max length.
 */
const createNotesService = async({
    input = {},
} = {}) => {
    const payload = pickAllowedFields(input, NOTE_ALLOWED_FIELDS);

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
        });

        if(canonicalSubTopic){
            payload.subTopic = canonicalSubTopic;
        }
    }

    return withTransaction(async(session) => {
        let note;

        try{
            [note] = await Note.create([payload], {session});

        }catch(error){
            translateMongooseWriteError(error)
        }

        await recordAuditLog({
            entityType: "Note",
            entityId: resolveId(note),
            action: "note.created",
            performedBy: payload.userId,
            session
        })

        return {
            note
        }
    })

}

export {
    createNotesService
}
