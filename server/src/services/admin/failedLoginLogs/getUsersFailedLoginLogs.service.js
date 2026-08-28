import { FailedLoginLog } from "../../../models/index.js";
import { NotFoundError } from "../../../errors/index.js";
import { paginateQuery } from "../../../utils/index.js";

/**
 * Returns a paginated page of failed-login attempts across all users —
 * e.g. `filter: { identifier }` to see every failed attempt against one
 * email/phone regardless of whether it ever matched a real account
 * (userId is null on failures against a nonexistent identifier).
 * @param {object} [params]
 * @param {object} [params.filter] - Extra query conditions (e.g. { userId, identifier, ipAddress }).
 * @param {number} [params.page=1]
 * @param {number} [params.limit=50]
 * @returns {Promise<{result: object, message: string}>}
 * @throws {NotFoundError} If no failed-login logs exist at all.
 */
const getUsersFailedLoginLogsService = async ({
    filter = {},
    page = 1,
    limit = 50,
} = {}) => {
    const result = await paginateQuery({
        model: FailedLoginLog,
        filter,
        page,
        limit,
    });

    if (!result.data.length) {
        throw new NotFoundError({
            message: "No failed login logs exist yet",
            code: "NO_FAILED_LOGIN_LOGS_EXIST",
        });
    }

    return {
        result,
        message: "All failed login logs successfully retrieved",
    };
};

export { getUsersFailedLoginLogsService };
