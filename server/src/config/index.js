import dotenv from "dotenv";

dotenv.config();

const {
    PORT,
    NODE_ENV,
    MONGO_URI,
    SERVICE,
    LOG_DIRECTORY,
} = process.env;


const requiredEnvs = {
    MONGO_URI,
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
/**
 * Parses an env var into a valid port number, falling back when it's
 * missing, blank, non-numeric, or outside the valid port range.
 * @param {string|undefined} value Raw env var value.
 * @param {number} fallback Value to use when `value` isn't a valid port.
 * @returns {number}
 */
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
        validNumber < 65535 ?
        validNumber :
        fallback;
}

const allowedNodeEnvs = ["development", "test", "production"];
let resolvedNodeEnvs;

if(
    !NODE_ENV ||
    NODE_ENV.trim() === "" ||
    typeof NODE_ENV !== "string"
){
    resolvedNodeEnvs = "development";
}else if(!allowedNodeEnvs.includes(NODE_ENV.trim())){
    throw new Error(`NODE_ENV must include ${allowedNodeEnvs.join(", ")}`)
}else{
    resolvedNodeEnvs = NODE_ENV.trim();
}

/** Validated, frozen app configuration — read env vars only through this, never `process.env` directly. */
const config = Object.freeze({
    port: toNumber(PORT, 6000),
    nodeEnv: resolvedNodeEnvs,
    mongoUri: MONGO_URI,
    service: SERVICE,
    logDirectory: LOG_DIRECTORY,
})

export {
    config,
}