/** Role name constants — use these instead of typing the raw strings, so a typo becomes a ReferenceError at the call site instead of a silent mismatch. */
const USER_ROLES = Object.freeze({
    "USER": "user",
    "ADMIN": "admin",
    "SUPERADMIN": "superadmin"
})

export { USER_ROLES };
