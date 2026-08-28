import { getUserService } from "../../../services/index.js";
import { sendResponse } from "../../../utils/index.js";

/**
 * GET /admin/users/:userId — admin: fetches a single user by id.
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 * @returns {import("express").Response}
 */
const getUserController = async (request, response) => {
    const { userId } = request.params;

    const { user } = await getUserService({ userId });

    return sendResponse(
        request,
        response,
        {
            view: "admin/users/userDetails",
            data: {
                user,
            },
            jsonData: {
                success: true,
            }
        }
    )
}

export { getUserController }
