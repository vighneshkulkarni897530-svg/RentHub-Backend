import winston from 'winston';
import env from './env';

const { combine, timestamp, printf, colorize, json } = winston.format;

const consoleFormat = printf(({ level, message, timestamp: ts, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${ts} [${level}]: ${message}${metaStr}`;
});

/**
 * Structured logger (Winston).
 * In production, outputs JSON for log aggregation.
 * In development, outputs human-readable colored logs.
 */
const logger = winston.createLogger({
  level: env.logLevel,
  format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), json()),
  transports: [new winston.transports.File({ filename: 'logs/error.log', level: 'error' })],
});

if (env.nodeEnv === 'production') {
  logger.add(new winston.transports.Console({ format: combine(timestamp(), json()) }));
} else {
  logger.add(
    new winston.transports.Console({
      format: combine(colorize(), timestamp({ format: 'HH:mm:ss' }), consoleFormat),
    })
  );
}

export default logger;

