import {
    User,
    RefreshToken,
} from "../../models/index.js";

import { withTransaction, fetchOrNotFound, hashToken } from "../../utils/index.js";
import { recordAuditLog } from "../audit/index.js";
import { BadRequestError, UnauthenticatedError } from "../../errors/index.js";


/**
 * Changes an already-authenticated user's password after re-verifying their
 * current one. Revokes every other active `RefreshToken` for this user
 * (so a stolen session elsewhere is killed the moment the real owner
 * changes their password) — except, if `currentRawRefreshToken` is given,
 * the session making *this* request is deliberately left alone, so
 * changing your password doesn't log you out of the device you're using.
 * Logs "user.password_changed" at "warning" severity.
 * @param {object} params
 * @param {string|import("mongoose").Types.ObjectId} params.userId
 * @param {string} params.currentPassword - Must match the account's existing password.
 * @param {string} params.newPassword
 * @param {string|null} [params.currentRawRefreshToken] - This request's own refresh token, if any, spared from revocation.
 * @param {object} [params.requestContext] - Result of `getAuditRequestContext(request)`, spread into the audit entry.
 * @returns {Promise<import("mongoose").Document>} The updated user.
 * @throws {import("../../errors/index.js").BadRequestError} If `currentPassword`/`newPassword` is missing.
 * @throws {import("../../errors/index.js").NotFoundError} If no user matches `userId`.
 * @throws {import("../../errors/index.js").UnauthenticatedError} If `currentPassword` doesn't match.
 */
const changePasswordService = async ({
    userId,
    currentPassword,
    newPassword,
    currentRawRefreshToken = null,
    requestContext = {},
} = {}) => {
    // GUARD: both passwords are required before touching the database.
    if (!currentPassword) {
        throw new BadRequestError({ message: "Current password is required", code: "CURRENT_PASSWORD_REQUIRED" });
    }

    if (!newPassword) {
        throw new BadRequestError({ message: "New password is required", code: "NEW_PASSWORD_REQUIRED" });
    }

    // Find the user (excluding soft-deleted accounts), opting back into the
    // normally-hidden `password` field so it can be compared below.
    const user = await fetchOrNotFound(User, userId, {
        notFoundMessage: "User not found",
        notFoundCode: "USER_NOT_FOUND",
        filter: {isDeleted: false},
        projection: "+password",
    });

    // CHECK: does the caller actually know the CURRENT password? This has
    // to be verified before allowing a change — otherwise anyone with a
    // valid access token (e.g. a stolen one) could change the password
    // without ever knowing it.
    const passwordMatches = await user.comparePassword(currentPassword);

    if (!passwordMatches) {
        throw new UnauthenticatedError({ message: "Current password is incorrect", code: "INVALID_CURRENT_PASSWORD" });
    }

    // Everything below runs in one transaction: the password change, the
    // session cleanup, and the audit entry all succeed together or not at all.
    return withTransaction(async (session) => {
        // STEP 1: Set the new password. user.model.js's own pre("save") hook
        // hashes it automatically — this line never touches a raw hash.
        user.password = newPassword;
        await user.save({ session });

        // STEP 2: Build a filter that revokes every OTHER active session,
        // but spares the one making this exact request (if we know which
        // one that is) — changing your password shouldn't log out the
        // device you're using right now.
        const keepTokenFilter = currentRawRefreshToken
            ? { tokenHash: { $ne: hashToken(currentRawRefreshToken) } }
            : {};

        // STEP 3: Revoke every matching RefreshToken in one bulk update.
        await RefreshToken.updateMany(
            { userId: user._id, revokedAt: null, ...keepTokenFilter },
            { $set: { revokedAt: new Date() } },
        ).session(session);

        // STEP 4: Record this as a security-relevant event ("warning" severity,
        // higher than a routine "info" audit entry).
        await recordAuditLog({
            entityType: "User",
            entityId: user._id,
            action: "user.password_changed",
            performedBy: userId,
            severity: "warning",
            session,
            ...requestContext,
        });

        return user;
    });
};

export { changePasswordService };
