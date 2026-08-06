import { getIO } from '../socket';
import NotificationRepository from '../repositories/NotificationRepository';
import UserRepository from '../repositories/UserRepository';
import { NotificationType } from '../models/Notification';
import notificationPreferenceService from './notificationPreferences.service';
import emailService from './email.service';
import smsService from './sms.service';
import pushService from './push.service';

export interface NotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================
// RentHub - Multi-Channel Notification Service
// ============================================================
// Dispatches to in-app (Socket.IO), email, SMS and push channels
// based on the user's notification preferences.
// Preserves existing createNotification / notify* signatures.
// ============================================================

/**
 * Create a notification and dispatch it across enabled channels.
 */
export async function createNotification(input: NotificationInput): Promise<void> {
  const notification = await NotificationRepository.createForUser(input.userId, {
    type: input.type,
    title: input.title,
    message: input.message,
    link: input.link,
    metadata: input.metadata || {},
  });

  // In-app via Socket.IO
  const io = getIO();
  if (io) {
    io.to(`user:${input.userId}`).emit('notification:new', {
      id: (notification as any)._id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      link: notification.link,
      read: notification.read,
      createdAt: (notification as any).createdAt,
    });
  }

  // Additional channels (email / sms / push) — best-effort, fire-and-forget
  void dispatchExternalChannels(input);
}

/**
 * Dispatch email / sms / push based on preferences.
 */
async function dispatchExternalChannels(input: NotificationInput): Promise<void> {
  const user = await UserRepository.findById(input.userId).catch(() => null);
  if (!user) return;

  const category = mapTypeToCategory(input.type);

  // Email
  if (await notificationPreferenceService.isChannelEnabled(input.userId, category, 'email')) {
    void emailService.sendGenericEmail(
      user.email,
      input.title,
      input.message,
      input.link
    ).catch(() => null);
  }

  // SMS
  if (user.phone && (await notificationPreferenceService.isChannelEnabled(input.userId, category, 'sms'))) {
    void smsService.sendSms({
      to: user.phone,
      message: `${input.title}: ${input.message}`,
    }).catch(() => null);
  }

  // Push
  if (await notificationPreferenceService.isChannelEnabled(input.userId, category, 'push')) {
    void pushService.sendPushToUser(input.userId, {
      title: input.title,
      message: input.message,
      url: input.link,
    }).catch(() => null);
  }
}

function mapTypeToCategory(type: NotificationType): string {
  switch (type) {
    case 'booking':
      return 'booking';
    case 'payment':
      return 'payment';
    case 'review':
      return 'review';
    case 'promotion':
      return 'marketing';
    case 'message':
    case 'system':
    case 'admin':
    default:
      return 'system';
  }
}

export async function notifyBookingCreated(data: { userId: string; title: string; message: string; link?: string }) {
  await createNotification({ userId: data.userId, type: 'booking', title: data.title, message: data.message, link: data.link });
}

export async function notifyBookingUpdated(data: { userId: string; title: string; message: string; link?: string }) {
  await createNotification({ userId: data.userId, type: 'booking', title: data.title, message: data.message, link: data.link });
}

export async function notifyDelivery(data: { userId: string; title: string; message: string; link?: string }) {
  await createNotification({ userId: data.userId, type: 'booking', title: data.title, message: data.message, link: data.link });
}

export async function notifyPaymentReceived(data: { userId: string; title: string; message: string; link?: string }) {
  await createNotification({ userId: data.userId, type: 'payment', title: data.title, message: data.message, link: data.link });
}

export async function notifyRefund(data: { userId: string; title: string; message: string; link?: string }) {
  await createNotification({ userId: data.userId, type: 'payment', title: data.title, message: data.message, link: data.link });
}

export default {
  createNotification,
  notifyBookingCreated,
  notifyBookingUpdated,
  notifyDelivery,
  notifyPaymentReceived,
  notifyRefund,
};
