/** Top-level barrel — re-exports every service from every sub-folder (auth, audit, ...), so a caller can do `import { loginService, recordAuditLog } from "../services/index.js"` from one place instead of reaching into each sub-folder separately. */
export * from "./auth/index.js";
export * from "./audit/index.js";
export * from "./notes/index.js";
export * from "./admin/index.js";