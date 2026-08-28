import { Note } from "../../models/index.js";
import { 
    BadRequestError, 
    NotFoundError
} from "../../errors/index.js";

/**
 * Lists active notes created by one user, paginated.
 * @param {object} params
 * @param {string} params.userId
 * @param {1|-1} [params.sortOrder=-1] - Sort direction by createdAt.
 * @returns {Promise<{sortOrder: number, data: object[], page: number, limit: number, total: number, totalPages: number, hasNextPage: boolean, hasPreviousPage: boolean}>}
 * @throws {BadRequestError} If userId is missing, or sortOrder isn't 1 or -1.
 * @throws {NotFoundError} If this user has no active notes.
 */
const getAllActiveNotesCreatedByUserService = async({
    userId,
    sortOrder = -1,
} = {}) => {

    if(!userId){
        throw new BadRequestError({
            message: "User id is required",
            code: "USER_ID_REQUIRED",
        })
    }

    if(
        sortOrder !== 1 &&
        sortOrder !== -1
    ){
        throw new BadRequestError({
            message: "SortOder can only be 1 or -1",
            code: "INVALID_SORT_ORDER",
        })
    }

    const notes = await Note.paginate({
        filter: {userId},
        options: {sort: {createdAt: sortOrder}, lean: true} 
    })

    if(notes.total  === 0){
        throw new NotFoundError({
            message: "No notes exists",
            code: "NO_NOTES_EXISTS",
        })
    }

    const { data, page, limit, total, totalPages, hasNextPage, hasPreviousPage} = notes;

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

export { getAllActiveNotesCreatedByUserService}