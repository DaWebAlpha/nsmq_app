import express from "express";
import { authRouter } from "./auth.routes.js";

/**
 * Top-level router — mounts every route group under its base path.
 */
const router = express.Router();

router.use("/auth", authRouter);

export { router };
