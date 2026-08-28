import { User, UserSecurity, RefreshToken } from "../../../models/index.js";
import { fetchOrNotFound, withTransaction } from "../../../utils/index.js";
import { recordAuditLog } from "../../audit/index.js";

/**
 * Bans a user and revokes all their active sessions, in one transaction.
 * @param {object} params
 * @param {string} params.userId
 * @param {string} [params.bannedByUserId]
 * @param {string} [params.reason]
 * @returns {Promise<{message: string}>}
 * @throws {BadRequestError} If userId is missing.
 * @throws {NotFoundError} If no user matches.
 */
const banUserService = async ({
    userId,
    bannedByUserId = null,
    reason = null,
} = {}) => {
    await fetchOrNotFound(User, userId, {
        idMessage: "UserId is required",
        idCode: "USER_ID_REQUIRED",
        notFoundMessage: "No user exists to ban",
        notFoundCode: "NO_USER_EXISTS_TO_BAN",
    });

    return withTransaction(async (session) => {
        const security = await UserSecurity.findOrCreateForUser(userId, { session });

        await security.ban({ bannedByUserId, reason, session });

        await RefreshToken.updateMany(
            { userId, revokedAt: null },
            { $set: { revokedAt: new Date() } },
        ).session(session);

        await recordAuditLog({
            entityType: "User",
            entityId: userId,
            action: "admin.userBanned",
            performedBy: bannedByUserId,
            reason,
            session,
        });

        return { message: "User banned successfully" };
    });
};

export { banUserService };
