import { User } from "../../../models/index.js";

/**
 * Returns active/total/deleted user counts for an admin dashboard.
 * @returns {Promise<{totalActiveUsers: number, totalUsers: number, totalDeletedUsers: number}>}
 */
const getUsersDashboardStatsService = async () => {
    const [totalActiveUsers, totalUsers, totalDeletedUsers] = await Promise.all([
        User.countDocuments({ isDeleted: false }),
        User.countDocuments({ isDeleted: { $in: [true, false] } }),
        User.countDocuments({ isDeleted: true }),
    ]);

    return { totalActiveUsers, totalUsers, totalDeletedUsers };
};

export { getUsersDashboardStatsService };
