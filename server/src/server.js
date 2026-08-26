import { app } from "./app.js";
import { config } from "./config/index.js";
import { connectDatabase} from "./config/database.js";
import { systemLogger } from "./logger/pino.logger.js";


/**
 * Connects to MongoDB, then starts the HTTP server — in that order, so
 * the app never accepts requests before the database is reachable. Exits
 * the process on failure so a process manager/hosting platform can detect
 * and restart it, rather than leaving it hung with nothing listening.
 * @returns {Promise<void>}
 */
const startServer = async() => {
    try{
        await connectDatabase();
        app.listen(config.port, () => {
            systemLogger.info(`Server listening on port: ${config.port}`);
        })
    }catch(error){
        systemLogger.error({err: error}, "Server connection error");
        process.exit(1);
    }
}

startServer();

