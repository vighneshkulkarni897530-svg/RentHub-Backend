import { Types } from 'mongoose';
import NotificationPreference, { INotificationPreference } from '../models/NotificationPreference';
import BaseRepository from './BaseRepository';

class NotificationPreferenceRepository extends BaseRepository<INotificationPreference> {
  constructor() {
    super(NotificationPreference);
  }

  async findByUser(userId: string): Promise<INotificationPreference | null> {
    return NotificationPreference.findOne({ user: userId as unknown as Types.ObjectId }).exec();
  }

  async upsertByUser(userId: string, categories: Record<string, unknown>): Promise<INotificationPreference> {
    return NotificationPreference.findOneAndUpdate(
      { user: userId as unknown as Types.ObjectId },
      { $set: { categories } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).exec() as Promise<INotificationPreference>;
  }
}

export default new NotificationPreferenceRepository();
