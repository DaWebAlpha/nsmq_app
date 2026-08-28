import { Note } from "../../models/index.js";
import { NotFoundError, BadRequestError } from "../../errors/index.js"
import { buildDeletedNotesFilter } from "./helpers/index.js";

/**
 * Lists soft-deleted notes, paginated — an admin "trash" view.
 * @param {object} [params]
 * @param {1|-1} [params.sortOrder=-1] - Sort direction by createdAt.
 * @param {object} [params.filter={}] - Raw filter input, run through buildDeletedNotesFilter.
 * @returns {Promise<{sortOrder: number, data: object[], page: number, limit: number, total: number, totalPages: number, hasNextPage: boolean, hasPreviousPage: boolean}>}
 * @throws {BadRequestError} If sortOrder isn't 1 or -1.
 * @throws {NotFoundError} If no deleted notes exist.
 */
const getAllDeletedNotesService = async({ sortOrder = -1, filter = {} } = {}) => {
    if(
        sortOrder !== 1 &&
        sortOrder !== -1
    ){
        throw new BadRequestError({
            message: "Sort order can only be -1 or 1",
            code: "INVALID_SORT_ORDER",
        })
    }

    const notes = await Note.paginate({
        filter: buildDeletedNotesFilter(filter),
        options: {sort: {createdAt: sortOrder}, lean: true}
    })

    if(notes.total === 0){
        throw new NotFoundError({
            message: "No notes exists",
            code: "NO_NOTES_EXISTS",
        })
    }

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
    getAllDeletedNotesService,
}