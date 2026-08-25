import mongoose from "mongoose";
import { MONGOOSE_OPTIONS } from "../constants/index.js";
import { config } from "../config/index.js";
import { systemLogger } from "../logger/pino.logger.js";

const connectDatabase = async () => {
    try{
        await mongoose.connect(config.mongoUri, MONGOOSE_OPTIONS);
    }catch(error){
        systemLogger.error({err: error}, "Database connection error");
        throw error;
    }
}

mongoose.connection.on("connected", () => {
    systemLogger.info("Database has been connected");
})

mongoose.connection.on("disconnected", () => {
    systemLogger.warn("Database has been disconnected");
})

mongoose.connection.on("error", (error) => {
    systemLogger.error({err: error}, "Database connection error")
})

export {
    connectDatabase,
}