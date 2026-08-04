import { getIO } from '../socket';
import NotificationRepository from '../repositories/NotificationRepository';
import { NotificationType } from '../models/Notification';

export interface NotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Create a notification and push it to the user in real-time (if connected).
 */
export async function createNotification(input: NotificationInput): Promise<void> {
  const notification = await NotificationRepository.createForUser(input.userId, {
    type: input.type,
    title: input.title,
    message: input.message,
    link: input.link,
    metadata: input.metadata || {},
  });

    // Real-time push via Socket.IO
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
}

export async function notifyBookingCreated(data: { userId: string; title: string; message: string; link?: string }) {
  await createNotification({ userId: data.userId, type: 'booking', title: data.title, message: data.message, link: data.link });
}

export async function notifyPaymentReceived(data: { userId: string; title: string; message: string; link?: string }) {
  await createNotification({ userId: data.userId, type: 'payment', title: data.title, message: data.message, link: data.link });
}

export default {
  createNotification,
  notifyBookingCreated,
  notifyPaymentReceived,
};

