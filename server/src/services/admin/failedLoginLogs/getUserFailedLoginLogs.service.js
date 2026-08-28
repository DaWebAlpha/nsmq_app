import { FailedLoginLog } from "../../../models/index.js";
import { NotFoundError, BadRequestError } from "../../../errors/index.js";
import { paginateQuery } from "../../../utils/index.js";

/**
 * Returns a paginated page of failed-login attempts for one user — for
 * spotting a burst of failures (brute-force/credential-stuffing) against
 * one specific account.
 * @param {object} params
 * @param {string} params.userId
 * @param {number} [params.page=1]
 * @param {number} [params.limit=50]
 * @returns {Promise<{result: object, message: string}>}
 * @throws {BadRequestError} If userId is missing.
 * @throws {NotFoundError} If no failed-login logs exist for this user.
 */
const getUserFailedLoginLogsService = async ({
    userId,
    page = 1,
    limit = 50,
} = {}) => {
    if (!userId) {
        throw new BadRequestError({
            message: "UserId is required",
            code: "USER_ID_REQUIRED",
        });
    }

    const result = await paginateQuery({
        model: FailedLoginLog,
        filter: { userId },
        page,
        limit,
    });

    if (!result.data.length) {
        throw new NotFoundError({
            message: "No failed login logs exist for this user",
            code: "NO_FAILED_LOGIN_LOGS_EXIST_FOR_USER",
        });
    }

    return {
        result,
        message: "User failed login logs successfully retrieved",
    };
};

export { getUserFailedLoginLogsService };
