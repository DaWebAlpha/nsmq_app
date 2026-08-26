import { app } from "./app.js";
import { config } from "./config/index.js";
import { connectDatabase} from "./config/database.js";
import { systemLogger } from "./logger/pino.logger.js";


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

