/** Account-lockout thresholds used by userSecurity.model.js's registerFailedAttempt(). */
const SECURITY_CONFIG = Object.freeze({
    MAX_FAILED_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION_MINUTES: 15,
});

export { SECURITY_CONFIG };
