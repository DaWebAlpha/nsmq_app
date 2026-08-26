import express from "express";
import { accessLogger } from "./logger/pino.logger.js";
import pinoHttp from "pino-http";
import { notFound } from "./middlewares/notFound.middleware.js";
import { errorHandler } from "./middlewares/errorHandler.middleware.js";
import path from "node:path";
import { fileURLToPath } from "node:url";



/**
 * The configured Express app — body parsing, EJS view engine, static
 * file serving, access logging, and the terminal notFound/errorHandler
 * middleware stack. Routes get mounted above `notFound` as they're added.
 */
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "..", "..", "client", "views"));
app.use(express.static(path.join(__dirname, "..", "..", "client", "public")));

app.use(pinoHttp({logger: accessLogger}));

app.use(notFound);
app.use(errorHandler);
export {
    app
};
