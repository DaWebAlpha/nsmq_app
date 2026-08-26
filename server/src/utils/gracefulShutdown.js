import mongoose from "mongoose";
import { systemLogger } from "../logger/pino.logger.js";

/**
 * ---------------------------------------------------------
 * GRACEFUL SHUTDOWN UTILITY
 * ---------------------------------------------------------
 *
 * Purpose:
 * Safely shuts down the application by:
 * - stopping new incoming connections
 * - allowing in-flight requests to complete
 * - closing open external resources
 * - forcing exit only if cleanup exceeds timeout
 *
 * Supported triggers:
 * - SIGINT
 * - SIGTERM
 * - uncaughtException
 * - unhandledRejection
 *
 * Notes:
 * - Designed to run once only
 * - Tracks active sockets so long-lived or stuck connections
 *   can be forcefully destroyed if shutdown hangs
 * - Uses unref() on timeout so it does not keep the event loop alive
 *
 * @param {import("http").Server | import("https").Server} server
 * @param {Object} [options]
 * @param {number} [options.forceExitTimeoutMs=30000]
 * @param {number} [options.connectionDrainTimeoutMs=5000]
 */
export function gracefulShutdown(server, options = {}) {
    const {
        forceExitTimeoutMs = 30_000,
        connectionDrainTimeoutMs = 5_000,
    } = options;


    let isShuttingDown = false;
    let handlersRegistered = false;
    const connections = new Set();

    if (server?.on) {
        server.on("connection", (socket) => {
            connections.add(socket);

            socket.on("close", () => {
                connections.delete(socket);
            });
        });
    }

    const destroyOpenSockets = () => {
        for (const socket of connections) {
            try {
                socket.destroy();
            } catch (error) {
                systemLogger.error(
                    { err: error },
                    "Failed to destroy socket during shutdown."
                );
            }
        }
    };

    const closeHttpServer = async () => {
        if (!server) return;

        if (!server.listening) {
            systemLogger.info("HTTP server is not listening. Skipping close.");
            return;
        }

        await new Promise((resolve, reject) => {
            server.close((err) => {
                if (err) {
                    return reject(err);
                }

                systemLogger.info("HTTP server closed.");
                resolve();
            });
        });
    };


    const closeMongoConnection = async () => {
        if (mongoose.connection.readyState === 0) {
            systemLogger.info("MongoDB already disconnected. Skipping close.");
            return;
        }

        await mongoose.disconnect();
        systemLogger.info("MongoDB connection closed.");
    };


    const wait = (ms) =>
        new Promise((resolve) => {
            const timer = setTimeout(resolve, ms);
            timer.unref?.();
        });

    /**
     * Core shutdown handler
     *
     * @param {string} signal
     * @param {Error|unknown} [error]
     */
    const shutdown = async (signal, error = null) => {
        if (isShuttingDown) {
            systemLogger.warn(
                { signal },
                "Shutdown already in progress. Ignoring additional trigger."
            );
            return;
        }

        isShuttingDown = true;

        systemLogger.warn(
            {
                signal,
                err: error instanceof Error ? error : undefined,
            },
            "Shutdown signal received. Starting graceful cleanup."
        );

        /**
         * Fail-safe timeout
         * Forces process termination if cleanup hangs too long
         */
        const forceExitTimer = setTimeout(() => {
            systemLogger.error(
                {
                    signal,
                    openConnections: connections.size,
                },
                `Shutdown timed out after ${forceExitTimeoutMs}ms. Forcing immediate exit.`
            );

            destroyOpenSockets();
            process.exit(1);
        }, forceExitTimeoutMs);

        forceExitTimer.unref?.();

        try {
            /**
             * Step 1: Stop accepting new requests
             */
            await closeHttpServer();

            /**
             * Step 2: Allow brief drain period for existing sockets
             */
            if (connections.size > 0) {
                systemLogger.info(
                    {
                        openConnections: connections.size,
                        drainTimeoutMs: connectionDrainTimeoutMs,
                    },
                    "Allowing existing connections to drain before forceful socket cleanup."
                );

                await wait(connectionDrainTimeoutMs);
            }

            /**
             * Step 3: Close MongoDB connection
             */
            await closeMongoConnection();

            /**
             * Step 4: Destroy any lingering sockets
             */
            if (connections.size > 0) {
                systemLogger.warn(
                    { openConnections: connections.size },
                    "Destroying lingering open sockets."
                );
            }

            destroyOpenSockets();

            clearTimeout(forceExitTimer);

            systemLogger.info(
                { signal },
                "Graceful shutdown completed successfully. Process exiting."
            );

            process.exit(signal === "uncaughtException" ? 1 : 0);
        } catch (err) {
            clearTimeout(forceExitTimer);

            systemLogger.fatal(
                {
                    signal,
                    err,
                    openConnections: connections.size,
                },
                "Graceful shutdown failed. Forcing process exit."
            );

            destroyOpenSockets();
            process.exit(1);
        }
    };

    /**
     * Register process-level shutdown handlers once
     */
    const registerHandlers = () => {
        if (handlersRegistered) return;
        handlersRegistered = true;

        process.once("SIGINT", () => {
            void shutdown("SIGINT");
        });

        process.once("SIGTERM", () => {
            void shutdown("SIGTERM");
        });

        process.once("uncaughtException", (error) => {
            systemLogger.fatal(
                { err: error },
                "Uncaught exception detected."
            );

            void shutdown("uncaughtException", error);
        });

        process.once("unhandledRejection", (reason) => {
            systemLogger.fatal(
                {
                    err: reason instanceof Error ? reason : undefined,
                    reason: reason instanceof Error ? reason.message : reason,
                },
                "Unhandled promise rejection detected."
            );

            void shutdown(
                "unhandledRejection",
                reason instanceof Error ? reason : null
            );
        });
    };

    registerHandlers();

    /**
     * Expose shutdown function for manual invocation in tests or bootstrap code
     */
    return {
        shutdown,
    };
}

export default gracefulShutdown;
