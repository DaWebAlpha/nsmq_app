import { getUserSecurityService } from "../../../services/index.js";
import { sendResponse } from "../../../utils/index.js";

/**
 * GET /admin/security/:userId — admin: fetches a user's UserSecurity record
 * (lockout/ban/suspension state) alongside the user.
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 * @returns {import("express").Response}
 */
const getUserSecurityController = async (request, response) => {
    const { userId } = request.params;

    const { security, user } = await getUserSecurityService({ userId });

    return sendResponse(
        request,
        response,
        {
            view: "admin/security/userSecurity",
            data: {
                security,
                user,
            },
            jsonData: {
                success: true,
            }
        }
    )
}

export { getUserSecurityController }
