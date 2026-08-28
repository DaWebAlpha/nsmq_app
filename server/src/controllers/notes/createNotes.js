import { createNotesService } from "../../services/index.js";
import { sendResponse } from "../../utils/index.js";
import { HTTP_STATUS } from "../../constants/index.js";

/**
 * POST /notes — creates a note owned by the logged-in user. `userId` is
 * always taken from `request.user.userId`, never trusted from the body.
 * Requires `authenticate` to have already run.
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 * @returns {import("express").Response}
 */
const createNotesController = async (request, response) => {
    const input = {
        ...request.body,
        userId: request.user.userId,
    };

    const { note } = await createNotesService({ input });

    return sendResponse(
        request,
        response,
        {
            statusCode: HTTP_STATUS.CREATED,
            view: "notes/noteCreated",
            data: {
                note,
            },
            jsonData: {
                success: true,
            }
        }
    )
}

export { createNotesController }
