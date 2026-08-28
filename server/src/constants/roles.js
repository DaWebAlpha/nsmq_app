/**
 * Role name constants — use these instead of typing raw role strings, so the
 * actual string values live in one place with editor autocomplete. Note this
 * only guards against typos in the *string value* (e.g. "admni"); a typo in
 * the *property name* (e.g. USER_ROLES.ADMINN) silently evaluates to
 * `undefined` rather than throwing — plain object property access never
 * errors on a missing key.
 */
const USER_ROLES = Object.freeze({
    "USER": "user",
    "ADMIN": "admin",
    "SUPERADMIN": "superadmin"
})

export { USER_ROLES };
