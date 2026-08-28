import dotenv from "dotenv";

dotenv.config();

const {
    PORT,
    NODE_ENV,
    MONGO_URI,
    SERVICE,
    LOG_DIRECTORY,
    JWT_ACCESS_SECRET,
    JWT_ACCESS_EXPIRY_SECONDS,
    JWT_REFRESH_EXPIRY_DAYS,
    MAIL_HOST,
    MAIL_PORT,
    MAIL_SECURE,
    MAIL_USER,
    MAIL_PASS,
    MAIL_FROM,
    PASSWORD_RESET_TOKEN_EXPIRY_MINUTES,
    ACCESS_TOKEN_COOKIE,
    REFRESH_TOKEN_COOKIE,
} = process.env;


// These two env vars are NON-NEGOTIABLE — the app literally cannot
// function without a database connection string or a JWT signing secret.
const requiredEnvs = {
    MONGO_URI,
    JWT_ACCESS_SECRET,
}

for(const [key, value] of Object.entries(requiredEnvs)){
    if(
        !value ||
        value.trim() === "" ||
        typeof value !== "string"
    ){
        throw new Error(`Missing .env value: ${key}`);
    }
}
const toNumber = (value, fallback) => {
    if(
        !value ||
        value.trim() === ""
    ){
        return fallback;
    }

    const validNumber = Number(value);

    return Number.isFinite(validNumber) &&
        validNumber > 0 &&
        validNumber <= 65535 ?
        validNumber :
        fallback;
}

const allowedNodeEnvs = ["development", "test", "production"];
let resolvedNodeEnvs;

let normalizedNodeEnv = String(NODE_ENV ?? "").trim().toLowerCase();

if(
    !normalizedNodeEnv 
){
    resolvedNodeEnvs = "development";
}else if(!allowedNodeEnvs.includes(normalizedNodeEnv)){
    throw new Error(`NODE_ENV must include ${allowedNodeEnvs.join(", ")}`)
}else{
    resolvedNodeEnvs = normalizedNodeEnv;
}


const config = Object.freeze({
    port: toNumber(PORT, 6000),
    nodeEnv: resolvedNodeEnvs,
    mongoUri: MONGO_URI,
    service: SERVICE,
    logDirectory: LOG_DIRECTORY,
    jwtAccessSecret: JWT_ACCESS_SECRET,
    jwtAccessExpirySeconds: toNumber(JWT_ACCESS_EXPIRY_SECONDS, 900),
    jwtRefreshExpiryDays: toNumber(JWT_REFRESH_EXPIRY_DAYS, 30),
    mailHost: MAIL_HOST,
    mailPort: toNumber(MAIL_PORT, 587),
    mailSecure: MAIL_SECURE === "true",
    mailUser: MAIL_USER,
    mailPass: MAIL_PASS,
    mailFrom: MAIL_FROM || MAIL_USER,
    passwordResetTokenExpiryMinutes: toNumber(PASSWORD_RESET_TOKEN_EXPIRY_MINUTES, 30),
    accessTokenCookie: ACCESS_TOKEN_COOKIE || "accessToken",
    refreshTokenCookie: REFRESH_TOKEN_COOKIE || "refreshToken",
})

export {
    config,
}