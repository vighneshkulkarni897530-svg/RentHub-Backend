import Razorpay from 'razorpay';
import env from './env';
import logger from './logger';

/**
 * Prepares the Razorpay client. If keys are missing, `razorpayInstance`
 * is null and payment routes will return a 503 "payments not configured"
 * so the rest of the app keeps working.
 */
const isConfigured = Boolean(env.razorpay.keyId && env.razorpay.keySecret);

let razorpayInstance: Razorpay | null = null;

if (isConfigured) {
  razorpayInstance = new Razorpay({
    key_id: env.razorpay.keyId,
    key_secret: env.razorpay.keySecret,
  });
  logger.info('Razorpay configured successfully.');
} else {
  logger.warn('Razorpay not configured — payment processing will be unavailable until keys are set in .env');
}

export { razorpayInstance, isConfigured };

