import { User } from "../../../models/index.js";
import { fetchOrNotFound, withTransaction } from "../../../utils/index.js";
import { BadRequestError, ForbiddenError } from "../../../errors/index.js";
import { USER_ROLES } from "../../../constants/index.js";
import { recordAuditLog } from "../../audit/index.js";

const ALLOWED_ROLES = Object.values(USER_ROLES);

/**
 * Changes a user's role; refuses to let an admin change their own role.
 * @param {object} params
 * @param {string} params.userId
 * @param {"user"|"admin"|"superadmin"} params.role
 * @param {string} [params.updatedByUserId]
 * @returns {Promise<{message: string, user: import("mongoose").Document}>}
 * @throws {BadRequestError} If role isn't one of the allowed values.
 * @throws {ForbiddenError} If updatedByUserId matches userId (self role-change).
 * @throws {NotFoundError} If no user matches userId.
 */
const updateUserRoleService = async ({
    userId,
    role,
    updatedByUserId = null,
} = {}) => {
    if (!ALLOWED_ROLES.includes(role)) {
        throw new BadRequestError({
            message: `Role must be one of: ${ALLOWED_ROLES.join(", ")}`,
            code: "INVALID_ROLE",
        });
    }

    if (updatedByUserId && String(userId) === String(updatedByUserId)) {
        throw new ForbiddenError({
            message: "You cannot change your own role",
            code: "CANNOT_CHANGE_OWN_ROLE",
        });
    }

    const user = await fetchOrNotFound(User, userId, {
        idMessage: "UserId is required",
        idCode: "USER_ID_REQUIRED",
        notFoundMessage: "No user exists",
        notFoundCode: "NO_USER_EXISTS",
    });

    const previousRole = user.role;

    return withTransaction(async (session) => {
        user.role = role;
        await user.update({ updatedByUserId, reason: `role changed from ${previousRole} to ${role}`, session });

        await recordAuditLog({
            entityType: "User",
            entityId: userId,
            action: "admin.userRoleUpdated",
            performedBy: updatedByUserId,
            metadata: { previousRole, newRole: role },
            session,
        });

        return { message: "User role updated successfully", user };
    });
};

export { updateUserRoleService };
