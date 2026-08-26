const DEFAULT_PAGE_SIZE = 20;
const DEFAULT_MAX_LIMIT = 100;


const hasOwn = (object, key) =>
    Object.prototype.hasOwnProperty.call(object, key);

/**
 * Paginates a query against a model, excluding soft-deleted documents by
 * default (unless `filter` already filters on `isDeleted` itself). Runs
 * the data and count queries sequentially when a session is given (a
 * session can only have one operation in flight at a time), or in
 * parallel otherwise.
 * @param {object} [options]
 * @param {import("mongoose").Model} options.model
 * @param {import("mongoose").FilterQuery} [options.filter={}]
 * @param {import("mongoose").ProjectionType} [options.projection={}]
 * @param {number} [options.page=1]
 * @param {number} [options.limit=20] Capped at 100.
 * @param {object} [options.options={}] `{ sort, populate, lean, ...rest }` — `rest` is passed to `.setOptions()`.
 * @param {import("mongoose").ClientSession} [options.session=null]
 * @returns {Promise<{data: object[], page: number, limit: number, total: number, totalPages: number, hasNextPage: boolean, hasPreviousPage: boolean}>}
 */
const paginationCollection = async({
    model,
    filter = {},
    projection = {},
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
    options = {},
    session = null
} = {}) => {
    const safePage = Math.max(1, Number(page) || 1);
    const requestedLimit = Math.max(1, Number(limit) || DEFAULT_PAGE_SIZE);

    const safeLimit = Math.min(requestedLimit, DEFAULT_MAX_LIMIT);

    const skip = (safePage - 1) * safeLimit;

    const finalFilter = hasOwn(filter, "isDeleted")
        ? filter
        : {...filter, isDeleted: false};

    const {sort, populate, lean, ...queryOptions} = options;

    let query = model.find(finalFilter, projection).setOptions(queryOptions);

    if(session){
        query = query.session(session);
    }

    if(sort){
        query = query.sort(sort)
    }

    query = query.skip(skip).limit(safeLimit);

    if(populate){
        query = query.populate(populate);
    }

    if(lean === true){
        query = query.lean();
    }

    let countQuery = model.countDocuments(finalFilter);

    if(session){
        countQuery = countQuery.session(session);
    }

    let data, total;

    if(session){
        data = await query.exec();
        total = await countQuery.exec();
    }else{
        [data, total] = await Promise.all([
            query.exec(),
            countQuery.exec()
        ]);
    }

    return {
        data,
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.max(1, Math.ceil(total / safeLimit)),
        hasNextPage: safePage * safeLimit < total,
        hasPreviousPage: safePage > 1
    }
    
}

export {
    paginationCollection
}
