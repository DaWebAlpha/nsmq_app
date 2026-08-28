import { User, UserSecurity } from "../../models/index.js";
import { fetchOrNotFound, resolvePaidAccess } from "../../utils/index.js";

/**
 * The logged-in user's own profile data — user record (including
 * `isPremiumAccess`, expired grants self-healed via `resolvePaidAccess`)
 * and security state.
 * @param {object} params
 * @param {string|import("mongoose").Types.ObjectId} params.userId
 * @returns {Promise<{ user: import("mongoose").Document, security: import("mongoose").Document|null }>}
 * @throws {import("../../errors/index.js").NotFoundError} If no user matches `userId`.
 */
const getCurrentUserService = async ({ userId } = {}) => {
    
    const user = await fetchOrNotFound(User, userId, {
        notFoundMessage: "User not found",
        notFoundCode: "USER_NOT_FOUND",
    });

    
    await resolvePaidAccess(user);

    
    const security = await UserSecurity.findOne({ userId });

    return { user, security };
};

export { getCurrentUserService };
