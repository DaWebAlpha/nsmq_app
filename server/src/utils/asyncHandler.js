/**
 * Wraps an async Express route/controller handler so a rejected promise
 * (or thrown error) is forwarded to `next(error)` instead of crashing the
 * process or hanging the request.
 * @param {(request: import("express").Request, response: import("express").Response) => Promise<unknown>} fn
 * @returns {import("express").RequestHandler}
 */
const asyncHandler = (fn) => (request, response, next) => {
    return Promise.resolve(fn(request, response)).catch(next);
}

export {
    asyncHandler,
}