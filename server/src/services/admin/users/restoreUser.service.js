import { User } from "../../../models/index.js";
import { fetchOrNotFound } from "../../../utils/index.js";
import { recordAuditLog } from "../../audit/index.js";

/**
 * Restores a soft-deleted user account.
 * @param {object} params
 * @param {string} params.userId
 * @param {string} [params.restoredByUserId]
 * @param {string} [params.reason]
 * @returns {Promise<{message: string}>}
 * @throws {BadRequestError} If userId is missing.
 * @throws {NotFoundError} If no user matches.
 */
const restoreUserService = async ({
    userId,
    restoredByUserId = null,
    reason = null,
} = {}) => {
    // Explicit isDeleted: true is required — createSchema's global find
    // filter hides soft-deleted documents unless a query opts in.
    const user = await fetchOrNotFound(User, userId, {
        idMessage: "UserId is required",
        idCode: "USER_ID_REQUIRED",
        notFoundMessage: "No user exists to restore",
        notFoundCode: "NO_USER_EXISTS_TO_RESTORE",
        filter: { isDeleted: true },
    });

    await user.restore({ restoredByUserId, reason });

    await recordAuditLog({
        entityType: "User",
        entityId: userId,
        action: "admin.userRestored",
        performedBy: restoredByUserId,
        reason,
    });

    return { message: "User successfully restored" };
};

export { restoreUserService };
