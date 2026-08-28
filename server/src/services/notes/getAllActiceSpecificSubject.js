import { Note } from "../../models/index.js";
import {
    NotFoundError,
    BadRequestError,
} from "../../errors/index.js";
import { normalizeValue } from "./helpers/index.js";

/**
 * Lists active notes for one subject, paginated.
 * @param {object} params
 * @param {string} params.subject
 * @param {1|-1} [params.sortOrder=-1] - Sort direction by createdAt.
 * @returns {Promise<{sortOrder: number, data: object[], page: number, limit: number, total: number, totalPages: number, hasNextPage: boolean, hasPreviousPage: boolean}>}
 * @throws {BadRequestError} If subject is missing/blank, or sortOrder isn't 1 or -1.
 * @throws {NotFoundError} If no notes exist for this subject.
 */
const getAllActiceSpecificSubjectService = async({
    subject,
    sortOrder = -1,
} = {}) => {
    if(
        !subject ||
        subject.trim() === "" 
    ){
        throw new BadRequestError({
            message: "Subject is required",
            code: "SUBJECT_IS_REQUIRED",
        })
    }

    if(
        sortOrder !== 1 &&
        sortOrder !== -1
    ){
        throw new BadRequestError({
            message: "SortOrder can be -1 or 1",
            code: "INVALID_SORT_ORDER",
        });
    }

    const normalizedSubject = normalizeValue(subject);

    const notes = await Note.paginate({
        filter: {subject: normalizedSubject},
        options: {sort: {createdAt: sortOrder}, lean: true},
    })

    if(notes.data.length === 0){
        throw new NotFoundError({
            message: "No notes exist",
            code: "NO_NOTES_EXISTS"
        })
    };

    const { data, page, limit, total, totalPages, hasNextPage, hasPreviousPage } = notes;
    return {
        sortOrder,
        data,
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPreviousPage
    }
}

export {
    getAllActiceSpecificSubjectService,
}