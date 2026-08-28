import { app } from "./app.js";
import { config } from "./config/index.js";
import { connectDatabase} from "./config/database.js";
import { systemLogger } from "./logger/pino.logger.js";
import { gracefulShutdown } from "./utils/index.js";

/**
 * Boots the app: connects to the database, starts listening on
 * `config.port`, and wires up graceful shutdown. Exits the process with
 * code 1 if either the database connection or the initial listen fails.
 * @returns {Promise<void>}
 */
const startServer = async() => {
    try{
        await connectDatabase();
        const server = app.listen(config.port, () => {
            systemLogger.info(`Server listening on port: ${config.port}`);
        })

        // Wire up SIGINT/SIGTERM/crash handlers so the process shuts down
        // cleanly (drains connections, closes the DB) instead of dying abruptly.
        gracefulShutdown(server);
    }catch(error){
        systemLogger.error({err: error}, "Server connection error");
        process.exit(1);
    }
}

startServer();

