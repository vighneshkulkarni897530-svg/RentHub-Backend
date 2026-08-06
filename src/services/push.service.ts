import env from '../config/env';
import logger from '../config/logger';
import PushSubscriptionRepository from '../repositories/PushSubscriptionRepository';
import { IPushSubscription } from '../models/PushSubscription';

// ============================================================
// RentHub - Web Push Notification Service
// ============================================================
// Sends push notifications to stored push subscriptions using
// Web Push (VAPID). Graceful no-op when VAPID keys are missing.
// ============================================================

interface PushPayload {
  title: string;
  message: string;
  url?: string;
  icon?: string;
}

let webpush: any = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  webpush = require('web-push');
} catch {
  webpush = null;
  logger.warn('web-push package not available — web push notifications disabled.');
}

const isConfigured = Boolean(env.push.vapidPublicKey && env.push.vapidPrivateKey);

/**
 * Send a push notification to a single subscription.
 */
export async function sendPushToSubscription(
  subscription: IPushSubscription,
  payload: PushPayload
): Promise<void> {
  if (!isConfigured) {
    logger.warn('[push] VAPID not configured — skipping push notification.');
    return;
  }
  try {
    if (!webpush) {
      logger.warn('[push] web-push package not available — skipping.');
      return;
    }
    webpush.setVapidDetails(env.push.vapidSubject, env.push.vapidPublicKey, env.push.vapidPrivateKey);
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
        expirationTime: subscription.expirationTime || null,
      },
      JSON.stringify({
        title: payload.title,
        message: payload.message,
        url: payload.url || '/',
        icon: payload.icon || '/icons/icon-192x192.png',
      })
    );
  } catch (error: any) {
    // Invalid/expired subscription — remove it
    if (error?.statusCode === 404 || error?.statusCode === 410) {
      logger.warn('[push] Removing stale subscription.');
      await PushSubscriptionRepository.remove(subscription.endpoint).catch(() => null);
      return;
    }
    logger.error(`[push] Send failed: ${(error as Error).message}`);
  }
}

/**
 * Send a push notification to all subscriptions of a user.
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<void> {
  if (!isConfigured) {
    return;
  }
  const subscriptions = await PushSubscriptionRepository.listForUser(userId);
  for (const sub of subscriptions) {
    await sendPushToSubscription(sub, payload);
  }
}

export default {
  sendPushToUser,
  sendPushToSubscription,
  isConfigured,
};
