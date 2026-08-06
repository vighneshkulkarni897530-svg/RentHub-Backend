import { Types } from 'mongoose';
import PushSubscription, { IPushSubscription } from '../models/PushSubscription';
import BaseRepository from './BaseRepository';

class PushSubscriptionRepository extends BaseRepository<IPushSubscription> {
  constructor() {
    super(PushSubscription);
  }

  async findByEndpoint(endpoint: string): Promise<IPushSubscription | null> {
    return PushSubscription.findOne({ endpoint }).exec();
  }

  async listForUser(userId: string): Promise<IPushSubscription[]> {
    return this.find({ user: userId as unknown as Types.ObjectId });
  }

  async upsert(userId: string, data: { endpoint: string; keys: { p256dh: string; auth: string }; expirationTime?: number | null; userAgent?: string }) {
    return PushSubscription.findOneAndUpdate(
      { endpoint: data.endpoint },
      {
        $set: {
          user: userId as unknown as Types.ObjectId,
          endpoint: data.endpoint,
          keys: data.keys,
          expirationTime: data.expirationTime ?? null,
          userAgent: data.userAgent || '',
        },
      },
      { new: true, upsert: true, runValidators: true }
    ).exec();
  }

  async remove(endpoint: string): Promise<void> {
    await PushSubscription.deleteOne({ endpoint }).exec();
  }
}

export default new PushSubscriptionRepository();
