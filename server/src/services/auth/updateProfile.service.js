import { User } from "../../models/index.js";
import { fetchOrNotFound, withTransaction, translateMongooseWriteError } from "../../utils/index.js";
import { recordAuditLog } from "../audit/index.js";

const ALLOWED_FIELDS = ["firstName", "lastName", "email", "phoneNumber"];

/**
 * Self-service profile edit — deliberately excludes `role`, unlike an
 * admin-facing update service could. A user can never promote themselves
 * this way. Only writes (and audits) fields that actually changed; a
 * no-op edit returns the user as-is without touching the database.
 * @param {object} params
 * @param {string|import("mongoose").Types.ObjectId} params.userId
 * @param {object} [params.input] - Candidate new values; only keys in `ALLOWED_FIELDS` are considered.
 * @param {object} [params.requestContext] - Result of `getAuditRequestContext(request)`, spread into the audit entry.
 * @returns {Promise<import("mongoose").Document>} The user, updated (and saved) if anything changed.
 * @throws {import("../../errors/index.js").NotFoundError} If no user matches `userId`.
 */
const updateProfileService = async ({
    userId,
    input = {},
    requestContext = {},
} = {}) => {
    const user = await fetchOrNotFound(User, userId, {
        notFoundMessage: "User not found",
        notFoundCode: "USER_NOT_FOUND",
    });

    const changes = {};

    // LOOP over only the fields this service is allowed to touch (never
    // `role` — see ALLOWED_FIELDS above, a user can't promote themselves).
    for (const field of ALLOWED_FIELDS) {
        // SKIP this field if the caller didn't send it, OR if the value is
        // identical to what's already stored — no point recording a "change"
        // that doesn't actually change anything.
        if (input[field] === undefined || input[field] === user[field]) {
            continue;
        }

        // Record the field-level diff (old value -> new value) for the
        // audit log, THEN apply it to the in-memory document.
        changes[field] = { from: user[field] ?? null, to: input[field] };
        user[field] = input[field];
    }

    // IF nothing actually changed, skip the database entirely — no save,
    // no transaction, no audit entry for a no-op edit.
    if (Object.keys(changes).length === 0) {
        return user;
    }

    // Otherwise, save the change and the audit entry together in one transaction.
    return withTransaction(async (session) => {
        try {
            await user.save({ session });
        } catch (error) {
            // IF the new email/phone collides with another account, or
            // fails validation, convert MongoDB's raw error into a typed
            // AppError and throw it.
            translateMongooseWriteError(error);
        }

        await recordAuditLog({
            entityType: "User",
            entityId: user._id,
            action: "user.updated",
            performedBy: userId,
            changes,
            metadata: { via: "self-service" },
            session,
            ...requestContext,
        });

        return user;
    });
};

export { updateProfileService };
