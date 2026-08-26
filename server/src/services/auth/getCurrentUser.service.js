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
    // Fetch the user, throwing a clean NotFoundError instead of returning
    // null/undefined if the id doesn't match anyone.
    const user = await fetchOrNotFound(User, userId, {
        notFoundMessage: "User not found",
        notFoundCode: "USER_NOT_FOUND",
    });

    // IF this user's premium access has quietly expired since the last time
    // anyone checked, resolvePaidAccess corrects isPremiumAccess/paidUntil
    // on the document AND saves it — so this response, and every future
    // read, reflects the truth instead of a stale flag.
    await resolvePaidAccess(user);

    // Security/lockout state lives in its own collection (high-frequency
    // writes like failed-login counts shouldn't collide with profile edits
    // on the same document) — fetched here as a second, separate query.
    // `security` can legitimately be null if this user has never triggered
    // UserSecurity.findOrCreateForUser (e.g. never logged in normally).
    const security = await UserSecurity.findOne({ userId });

    return { user, security };
};

export { getCurrentUserService };
