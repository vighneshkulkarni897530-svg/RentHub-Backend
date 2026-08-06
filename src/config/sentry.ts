import * as Sentry from '@sentry/node';
import env from './env';
import logger from './logger';

/**
 * Initialize Sentry for error tracking & performance monitoring.
 * Only initializes when a SENTRY_DSN is provided (NODE_ENV=production).
 * Safe no-op in development / when DSN is absent, so the app still starts.
 */
export function initSentry() {
  const dsn = env.sentryDsn || process.env.SENTRY_DSN;
  if (!dsn) {
    logger.info('Sentry DSN not set — error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn,
    environment: env.nodeEnv,
    tracesSampleRate: env.sentryTracesSampleRate,
    integrations: [
      Sentry.expressIntegration(),
      Sentry.httpIntegration(),
    ],
    // Only capture ~10% of transactions in production to control cost
    beforeSend(event) {
      // Override/scrub sensitive fields here if needed
      return event;
    },
  });

  logger.info('Sentry initialized for error tracking and performance monitoring.');
}

// Capture unhandled Promise rejections and uncaught exceptions.
export function setupGlobalSentry() {
  process.on('unhandledRejection', (reason) => {
    Sentry.captureException(reason);
  });
  process.on('uncaughtException', (error) => {
    Sentry.captureException(error);
  });
}

export default initSentry;
