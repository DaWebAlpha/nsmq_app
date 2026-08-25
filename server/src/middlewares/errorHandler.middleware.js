import { HTTP_STATUS } from "../constants/index.js";
import { sendResponse } from "../utils/index.js";
import { config } from "../config/index.js";
import { systemLogger } from "../logger/pino.logger.js";


/**
 * Express error-handling middleware (4-arg signature) — must be mounted
 * last, after all routes. Logs every error via systemLogger, then responds
 * with the error's own statusCode/code when it's an operational AppError,
 * or a generic 500 message otherwise so internal details never leak to a
 * non-operational error's response. Stack traces are only included in the
 * JSON response body outside production.
 * @param {Error & {statusCode?: number, code?: string, isOperational?: boolean}} error
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 * @param {import("express").NextFunction} next
 */
const errorHandler = (error, request, response, next) => {
    if(response.headersSent){
        return next(error);
    }

    const isDevelopment = config.nodeEnv === "development";

    const code = error.code || "INTERNAL_SERVER_ERROR";
    const isOperational = error.isOperational || false;

    const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    const stack = isDevelopment ? error.stack : "";

    const message = isOperational ? error.message : "Something went wrong"

    systemLogger.error(
        {
            message,
            code,
            stack,
            isOperational,
            statusCode,
            method: request.method,
            url: request.originalUrl,
        },
        "An unexpected error occured",
    )

    return sendResponse(
        request,
        response,
        {
            statusCode,
            view: "pages/error",
            data: {
                title: `${statusCode} ${code}`,
                message,
                code,
            },
            jsonData: {
                success: false,
                stack,
            },
            viewData: {statusCode}
        }
    )
};


export{
    errorHandler,
}