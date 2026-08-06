import { FilterQuery, Types } from 'mongoose';
import Referral, { IReferral } from '../models/Referral';
import BaseRepository from './BaseRepository';

class ReferralRepository extends BaseRepository<IReferral> {
  constructor() {
    super(Referral);
  }

  async findByCode(code: string): Promise<IReferral | null> {
    return Referral.findOne({ code: code.toUpperCase() }).exec();
  }

  async listForReferrer(referrerId: string, options: { page?: number; limit?: number }) {
    const filter: FilterQuery<IReferral> = { referrer: referrerId as unknown as Types.ObjectId };
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;
    const total = await this.countDocuments(filter);
    const data = await this.find(filter, {
      populate: { path: 'referredUser', select: 'name email avatar' },
      sort: { createdAt: -1 as 1 | -1 },
      skip,
      limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}

export default new ReferralRepository();
