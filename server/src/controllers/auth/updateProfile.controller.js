import { updateProfileService } from "../../services/index.js";
import { asyncHandler, getAuditRequestContext, responseAction } from "../../utils/index.js";

/**
 * POST /auth/me/update — updates the logged-in user's own firstName/lastName/email/phoneNumber (never role).
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 * @returns {Promise<void>}
 */
const updateProfileController = asyncHandler(async (request, response) => {
    await updateProfileService({
        userId: request.user.userId,
        input: request.body,
        requestContext: getAuditRequestContext(request),
    });

    return responseAction(request, response, {
        success: true,
        message: "Profile updated successfully",
        redirectTo: "/auth/me",
    });
});

export { updateProfileController };
