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