import { Types } from 'mongoose';
import LoyaltyAccount, { ILoyaltyAccount, ILoyaltyTransaction } from '../models/LoyaltyAccount';
import BaseRepository from './BaseRepository';

class LoyaltyAccountRepository extends BaseRepository<ILoyaltyAccount> {
  constructor() {
    super(LoyaltyAccount);
  }

  async findByUser(userId: string): Promise<ILoyaltyAccount | null> {
    return LoyaltyAccount.findOne({ user: userId as unknown as Types.ObjectId }).exec();
  }

  async getOrCreate(userId: string): Promise<ILoyaltyAccount> {
    const existing = await this.findByUser(userId);
    if (existing) return existing;
    return (await this.create({
      user: userId as unknown as Types.ObjectId,
      points: 0,
      lifetimePoints: 0,
      level: 'bronze',
      transactions: [],
    })) as ILoyaltyAccount;
  }

  async addTransaction(
    userId: string,
    transaction: ILoyaltyTransaction,
    deltaPoints: number
  ): Promise<ILoyaltyAccount | null> {
    return LoyaltyAccount.findOneAndUpdate(
      { user: userId as unknown as Types.ObjectId },
      {
        $inc: { points: deltaPoints, lifetimePoints: deltaPoints > 0 ? deltaPoints : 0 },
        $push: { transactions: transaction },
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).exec();
  }
}

export default new LoyaltyAccountRepository();
