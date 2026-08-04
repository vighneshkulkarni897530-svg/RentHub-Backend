import UserBehavior, { IUserBehavior, BehaviorType } from '../models/UserBehavior';
import BaseRepository from './BaseRepository';

class UserBehaviorRepository extends BaseRepository<IUserBehavior> {
  constructor() {
    super(UserBehavior);
  }

  async track(data: Partial<IUserBehavior>): Promise<IUserBehavior> {
    return this.create(data);
  }

  /** Recent behaviors of a user, optionally filtered by type. */
  async recentByUser(
    userId: string,
    type?: BehaviorType,
    limit = 100
  ): Promise<IUserBehavior[]> {
    const filter: Record<string, unknown> = { user: userId };
    if (type) filter.type = type;
    return this.find(filter as any, {
      sort: { createdAt: -1 as 1 | -1 },
      limit,
    });
  }

  /** Product ids a user interacted with (deduped, most recent first). */
  async recentProductIds(userId: string, limit = 50): Promise<string[]> {
    const result = await UserBehavior.aggregate([
      { $match: { user: userId, product: { $exists: true, $ne: null } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$product',
          weight: { $sum: '$weight' },
          last: { $first: '$createdAt' },
        },
      },
      { $sort: { last: -1 } },
      { $limit: limit },
      { $project: { _id: 1 } },
    ]).exec();
    return result.map((r) => String(r._id));
  }

  /** Category ids the user preferred (by weighted behavior count). */
  async preferredCategoryIds(userId: string, limit = 10): Promise<string[]> {
    const result = await UserBehavior.aggregate([
      { $match: { user: userId, category: { $exists: true, $ne: null } } },
      { $group: { _id: '$category', weight: { $sum: '$weight' } } },
      { $sort: { weight: -1 } },
      { $limit: limit },
      { $project: { _id: 1 } },
    ]).exec();
    return result.map((r) => String(r._id));
  }

  /** Users who interacted with the same product (for collaborative filtering). */
  async similarUsers(userId: string, productIds: string[], limit = 20): Promise<string[]> {
    const result = await UserBehavior.aggregate([
      {
        $match: {
          user: { $ne: userId },
          product: { $in: productIds },
        },
      },
      { $group: { _id: '$user', score: { $sum: '$weight' } } },
      { $sort: { score: -1 } },
      { $limit: limit },
      { $project: { _id: 1 } },
    ]).exec();
    return result.map((r) => String(r._id));
  }
}

export default new UserBehaviorRepository();
