const PAID_ACCESS_DURATION_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * The `paidUntil` value to set whenever an admin grants paid access —
 * exactly one year from now.
 * @returns {Date}
 */
const computePaidUntil = () => new Date(Date.now() + PAID_ACCESS_DURATION_MS);

/**
 * Pure read: does this user currently have unexpired paid access? Safe to
 * call on a `.lean()` plain object as well as a real Mongoose document —
 * doesn't mutate or persist anything, so callers that only need a
 * yes/no (e.g. a notes listing) don't pay for a write.
 * @param {{isPremiumAccess?: boolean, paidUntil?: Date|string|null}|null|undefined} user
 * @returns {boolean}
 */
const isPaidActive = (user) => {
    // IF the user object doesn't exist or isPremiumAccess is false/missing,
    // they are a standard free tier user. Deny access immediately.
    if (!user?.isPremiumAccess) {
        return false;
    }

    // IF they passed the premium check but have no expiration date (null/missing),
    // they are a permanent Lifetime Member or Admin. Grant access forever.
    if (!user.paidUntil) {
        return true;
    }

    // IF they are a regular subscriber with a date, check the clock.
    // Return true if their expiration date timestamp is still in the future.
    return new Date(user.paidUntil).getTime() > Date.now();
};

/**
 * Same check as `isPaidActive`, but for a real (non-lean) Mongoose
 * document: if paid access has expired, flips `isPremiumAccess` back to false and
 * clears `paidUntil` and persists it, so the record stops lying about its
 * own state on every future read (admin views included) instead of only
 * ever being corrected lazily at read time.
 * @param {import("mongoose").Document & {isPremiumAccess: boolean, paidUntil: Date|null}} user
 * @returns {Promise<boolean>} Whether the user has active paid access, after any needed correction.
 */
const resolvePaidAccess = async (user) => {

    // IF the user is a Free Tier account (isPremiumAccess is false)
    // OR a Lifetime Account (paidUntil is null), process them instantly.
    // Returns false for free users, and true for lifetime users.
    if (!user?.isPremiumAccess || !user.paidUntil) {
        return Boolean(user?.isPremiumAccess);
    }

    // IF the subscriber's expiration date is greater than the current time,
    // their subscription is still valid. Grant access and change nothing.
    if (user.paidUntil.getTime() > Date.now()) {
        return true;
    }

    // FALLBACK (Expired Subscriber): If they failed both checks above, their subscription has ended.
    // Revoke their premium flags, clear their date, and save the downgrade to the database.
    user.isPremiumAccess = false;
    user.paidUntil = null;
    await user.save();

    return false;
};

export { computePaidUntil, isPaidActive, resolvePaidAccess };
