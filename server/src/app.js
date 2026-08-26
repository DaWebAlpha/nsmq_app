import express from "express";
import cookieParser from "cookie-parser";
import { accessLogger } from "./logger/pino.logger.js";
import pinoHttp from "pino-http";
import { notFound } from "./middlewares/notFound.middleware.js";
import { errorHandler } from "./middlewares/errorHandler.middleware.js";
import { router } from "./routes/index.js";
import path from "node:path";
import { fileURLToPath } from "node:url";



const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Parses the Cookie header into `request.cookies` — required for every
// cookie-based auth read in this app (authenticate.middleware.js, login/
// logout/refresh/changePassword controllers all read request.cookies).
// Without this, request.cookies is always undefined and cookie auth
// silently never works.
app.use(cookieParser());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "..", "..", "client", "views"));
app.use(express.static(path.join(__dirname, "..", "..", "client", "public")));

app.use(pinoHttp({logger: accessLogger}));

// All real routes (currently just /auth/*) are mounted here.
app.use(router);

// IMPORTANT: middleware/routes run in the order they're registered.
// `notFound` and `errorHandler` MUST be mounted LAST — after every real
// route — so a matched route gets handled first, and only an unmatched
// request falls through to `notFound`.
app.use(notFound);
app.use(errorHandler);
export {
    app
};
