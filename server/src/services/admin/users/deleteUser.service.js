import { User } from "../../../models/index.js";
import { fetchOrNotFound } from "../../../utils/index.js";
import { recordAuditLog } from "../../audit/index.js";

/**
 * Soft-deletes a user account.
 * @param {object} params
 * @param {string} params.userId
 * @param {string} [params.deletedByUserId]
 * @param {string} [params.reason]
 * @returns {Promise<{message: string}>}
 * @throws {BadRequestError} If userId is missing.
 * @throws {NotFoundError} If no user matches.
 */
const deleteUserService = async ({
    userId,
    deletedByUserId = null,
    reason = null,
} = {}) => {
    const user = await fetchOrNotFound(User, userId, {
        idMessage: "UserId is required",
        idCode: "USER_ID_REQUIRED",
        notFoundMessage: "No user exists to delete",
        notFoundCode: "NO_USER_EXISTS_TO_DELETE",
    });

    await user.softDelete({ deletedByUserId, reason });

    await recordAuditLog({
        entityType: "User",
        entityId: userId,
        action: "admin.userDeleted",
        performedBy: deletedByUserId,
        reason,
    });

    return { message: "User successfully deleted" };
};

export { deleteUserService };
