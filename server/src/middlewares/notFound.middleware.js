import { HTTP_STATUS } from "../constants/index.js";
import { sendResponse } from "../utils/index.js";
import { systemLogger } from "../logger/pino.logger.js";


/**
 * Catch-all 404 handler — mount after every route so any unmatched URL
 * ends up here instead of Express's default HTML error page.
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 * @returns {import("express").Response}
 */
const notFound = (request, response) => {


    const code = "NOT_FOUND_ERROR";
    const statusCode = HTTP_STATUS.NOT_FOUND;
    const message = `The requested url ${request.originalUrl} could not be found.`;
   
    systemLogger.info(
        {
            statusCode,
            success: false,
            method: request.method,
            url: request.originalUrl,
            code
        },
        message
    )
    return sendResponse(
        request,
        response,
        {
            statusCode: HTTP_STATUS.NOT_FOUND,
            view: "pages/404",
            data: {
                title: `${statusCode} ${code}`,
                message,
                code
            },
            jsonData: {
                success: false,
            }
        }
    )
}

export {
    notFound
}