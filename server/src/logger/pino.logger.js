import pino from "pino";
import fs from "node:fs";
import path from "node:path";
import { config } from "../config/index.js";
import { SENSITIVE_FIELDS } from "../constants/index.js";

const isDevelopment = config.nodeEnv === "development";
const logLevel = isDevelopment ? "debug" : "info";

const logDirectory = path.resolve(config.logDirectory);

if(!fs.existsSync(logDirectory)){
    fs.mkdirSync(logDirectory, {recursive: true});
}

/**
 * Builds one pino-roll file transport target (daily/size-rolled, JSON files).
 * @param {string} fileLocation Path (relative to the log directory) and base filename for the rolled files.
 * @param {string} frequency Roll frequency, e.g. "daily".
 * @param {string} fileSize Max size per file before rolling, e.g. "20m".
 * @param {string} [minLevel=logLevel] Minimum pino level written to this target.
 * @param {number} retentionCount Number of rolled files to retain before deletion.
 * @returns {object} A pino.transport target config.
 */
const buildTargetTransport = (
    fileLocation,
    frequency,
    fileSize,
    minLevel = logLevel,
    retentionCount
) => ({
    target: "pino-roll",
    level: minLevel,
    options: {
        file: path.join(logDirectory, fileLocation),
        extension: ".json",
        frequency,
        size: fileSize,
        mkdir: true,
        dateFormat: "yyyy-MM-dd",
        limit: {
            count: retentionCount,
        },
        sync: false,
    }
})

const terminalTargets = isDevelopment
    ? [
        {
            target: "pino-pretty",
            options: {
                colorize: true,
                ignore: "pid,hostname",
                translateTime: "SYS:yyyy-MM-dd HH:mm:ss"
            }
        }
    ] : 
    [];



const systemTransport = pino.transport({
    targets: [
        buildTargetTransport(
            "system/app-info",
            "daily",
            "20m",
            "info",
            180
        ),
        buildTargetTransport(
            "system/app-error",
            "daily",
            "20m",
            "error",
            180,
        ),
        ...terminalTargets,
    ]
});


const accessTarget = pino.transport({
    targets: [
        buildTargetTransport(
            "access/app-access",
            "daily",
            "20m",
            "info",
            180
        ),
        ...terminalTargets,
    ]
})

const auditTransport = pino.transport({
    targets: [
        buildTargetTransport(
            "audit/app-audit",
            "daily",
            "20m",
            "info",
            180
        ),
        ...terminalTargets
    ]
})


/** Shared pino options (level, timestamp, service/env base fields, redaction, level_label mixin) used by every logger instance. */
const getBaseConfig = () => ({
    level: logLevel,
    timestamp: pino.stdTimeFunctions.isoTime,
    base: {
        service: config.service,
        environment: config.nodeEnv,
    },
    redact:{
        paths: [
            ...SENSITIVE_FIELDS,
        ],
        remove: true
    },
    mixin(_context, levelNumber){
        const labels = {
            10: "trace",
            20: "debug",
            30: "info",
            40: "warn",
            50: "error",
            60: "fatal"
        };
        return{
            level_label: labels[levelNumber] || logLevel
        }
    }
})

/** General app/system events (startup, shutdown, DB connection, uncaught errors). */
export const systemLogger = pino(
    getBaseConfig(),
    systemTransport,
)

/** Security/compliance-relevant events (auth, admin actions, data changes). */
export const auditLogger = pino(
    getBaseConfig(),
    auditTransport,
)

/** Per-request HTTP access logs. */
export const accessLogger = pino(
    getBaseConfig(),
    accessTarget,
)

/** Convenience bundle of all three logger instances. */
export const loggers = {
    systemLogger,
    auditLogger,
    accessLogger
}