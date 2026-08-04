import { FilterQuery, Types } from 'mongoose';
import Notification, { INotification } from '../models/Notification';
import BaseRepository from './BaseRepository';

class NotificationRepository extends BaseRepository<INotification> {
  constructor() {
    super(Notification);
  }

  async listForUser(userId: string, options: { page?: number; limit?: number; unreadOnly?: boolean }) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;
    const filter: FilterQuery<INotification> = { user: userId as unknown as Types.ObjectId };
    if (options.unreadOnly) filter.read = false;
    const total = await this.countDocuments(filter);
    const data = await this.find(filter, {
      sort: { createdAt: -1 as 1 | -1 },
      skip,
      limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit), unreadCount: await this.unreadCount(userId) };
  }

  async unreadCount(userId: string): Promise<number> {
    return this.countDocuments({ user: userId as unknown as Types.ObjectId, read: false });
  }

  async markAsRead(id: string, userId: string): Promise<INotification | null> {
    return this.findOneAndUpdate(
      { _id: id, user: userId },
      { $set: { read: true, readAt: new Date() } },
      { new: true }
    );
  }

  async markAllAsRead(userId: string): Promise<void> {
    await Notification.updateMany(
      { user: userId, read: false },
      { $set: { read: true, readAt: new Date() } }
    ).exec();
  }

  async createForUser(userId: string, data: Partial<INotification>): Promise<INotification> {
    return this.create({ user: userId as unknown as Types.ObjectId, ...data } as Partial<INotification>);
  }
}

export default new NotificationRepository();

