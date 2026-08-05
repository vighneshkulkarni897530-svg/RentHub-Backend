import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import env from './env';

const { combine, timestamp, printf, colorize, json } = winston.format;

const consoleFormat = printf(({ level, message, timestamp: ts, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${ts} [${level}]: ${message}${metaStr}`;
});

/**
 * Structured logger (Winston) with daily-rotating file transports.
 * - In production: JSON output to console + rotating files (error.log, combined.log).
 * - In development: human-readable colored console output.
 * - Rotates daily, keeps 14 days of history, max 100MB per file.
 */
const logger = winston.createLogger({
  level: env.logLevel,
  format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), json()),
  transports: [
    // Error-level rotating log
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '100m',
      maxFiles: '14d',
      zippedArchive: true,
    }),
    // All-level rotating log
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '100m',
      maxFiles: '14d',
      zippedArchive: true,
    }),
  ],
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
