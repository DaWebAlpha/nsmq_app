
/**
 * Field-path patterns redacted from log output (see logger/pino.logger.js's
 * `redact` config). Supports pino's dot-path and `*.field` wildcard syntax.
 */
const SENSITIVE_FIELDS = Object.freeze([
    // --- Authentication & Credentials ---
    "password",
    "passwords",
    "*.password",
    "pin",
    "*.pin",
    "passcode",
    "secret",
    "*.secret",
    "secretKey",
    "*.secretKey",      
    "client_secret",
    "clientSecret",
    "mongoUri",        
                         
    // --- Tokens & API Keys ---
    "token",
    "*.token",
    "accessToken",
    "access_token",
    "*.accessToken",
    "*.access_token",
    "refreshToken",
    "refresh_token",
    "*.refreshToken",
    "*.refresh_token",
    "apiKey",
    "apikey",
    "api_key",
    "*.apiKey",
    "*.api_key",
    "bearer",

    // --- Cookies & Session State ---
    "cookie",
    "cookies",
    "*.cookie",
    "*.cookies",
    "accessCookie",
    "refreshCookie",
    "session",
    "sessionId",
    "session_id",

    // --- HTTP Protocols & Header Paths ---
    "authorization",
    "*.authorization",
    "headers.cookie",
    "headers.authorization",
    "headers.x-api-key",
    "request.headers.cookie",
    "request.headers.cookies",
    "request.headers.authorization",
    "req.headers.authorization",
    "req.headers.cookie",

    // --- Financial & Payment Information (PCI-DSS compliance) ---
    "card",
    "cardNumber",
    "card_number",
    "*.cardNumber",
    "*.card_number",
    "ccv",
    "cvv",
    "*.cvv",
    "*.ccv",
    "expiryMonth",
    "expiryYear",
    "bankAccount",
    "iban",

    // --- Personally Identifiable Information (PII) ---
    "ssn",
    "*.ssn",
    "socialSecurityNumber",
    "nationalId",
    "taxId",

    // --- Database Internal Cruft (Clean up logs noise) ---
    "__v",
    "_id"
]);

export { SENSITIVE_FIELDS };

