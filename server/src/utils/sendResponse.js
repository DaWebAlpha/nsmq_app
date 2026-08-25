import { HTTP_STATUS } from "../constants/httpStatus.js";

/**
 * Sends a response as JSON or a rendered view, negotiated from the
 * request's `Accept` header (`request.accepts`).
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 * @param {object} [options]
 * @param {number} [options.statusCode=HTTP_STATUS.OK]
 * @param {string} [options.view] View name to render for non-JSON requests.
 * @param {object} [options.data={}] Fields merged into both the JSON body and the view's local data.
 * @param {object} [options.jsonData={}] Fields merged into the JSON body only (after `data`).
 * @param {object} [options.viewData={}] Extra data passed to the view as `viewData`.
 * @returns {import("express").Response}
 */
const sendResponse = (
    request,
    response,
    {
        statusCode = HTTP_STATUS.OK,
        view,
        data = {},
        jsonData = {},
        viewData = {}
} = {}) => {
    const wantsJson = request.accepts(["html", "json"]) === "json";

    if(wantsJson){
        return response.status(statusCode).json({
            ...data,
            ...jsonData
        })
    }

    return response.status(statusCode).render(view, {
        ...data,
        viewData,
    })
}

export { sendResponse };