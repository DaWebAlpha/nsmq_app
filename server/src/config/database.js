import mongoose from "mongoose";
import { MONGOOSE_OPTIONS } from "../constants/index.js";
import { config } from "../config/index.js";
import { systemLogger } from "../logger/pino.logger.js";

/**
 * Opens the mongoose connection using `config.mongoUri`. Connection-state
 * changes are logged separately via the `mongoose.connection` listeners
 * below; this function only surfaces the initial connect failure.
 * @returns {Promise<void>}
 * @throws Rethrows the original mongoose connection error after logging it.
 */
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