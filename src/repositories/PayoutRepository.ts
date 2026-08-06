import { FilterQuery, PopulateOptions, Types } from 'mongoose';
import Payout, { IPayout } from '../models/Payout';
import BaseRepository from './BaseRepository';

const payoutPopulate: PopulateOptions[] = [
  { path: 'owner', select: 'name email avatar storeName' },
];

class PayoutRepository extends BaseRepository<IPayout> {
  constructor() {
    super(Payout);
  }

  async findByPayoutId(payoutId: string): Promise<IPayout | null> {
    return Payout.findOne({ payoutId }).exec();
  }

  async listForOwner(ownerId: string, options: { page?: number; limit?: number }) {
    return this.paginate({ owner: ownerId as unknown as Types.ObjectId }, options);
  }

  async listAll(options: { page?: number; limit?: number; status?: string }) {
    const filter: FilterQuery<IPayout> = {};
    if (options.status) filter.status = options.status as IPayout['status'];
    return this.paginate(filter, options);
  }

  private async paginate(filter: FilterQuery<IPayout>, options: { page?: number; limit?: number }) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;
    const total = await this.countDocuments(filter);
    const data = await this.find(filter, {
      populate: payoutPopulate,
      sort: { createdAt: -1 as 1 | -1 },
      skip,
      limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}

export default new PayoutRepository();
