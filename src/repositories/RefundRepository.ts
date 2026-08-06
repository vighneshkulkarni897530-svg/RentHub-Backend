import { FilterQuery, PopulateOptions, Types } from 'mongoose';
import Refund, { IRefund } from '../models/Refund';
import BaseRepository from './BaseRepository';

const refundPopulate: PopulateOptions[] = [
  { path: 'booking', select: 'startDate endDate totalPrice status' },
  { path: 'payment', select: 'amount status method' },
  { path: 'user', select: 'name email avatar' },
  { path: 'owner', select: 'name email avatar' },
];

class RefundRepository extends BaseRepository<IRefund> {
  constructor() {
    super(Refund);
  }

  async findByRefundId(refundId: string): Promise<IRefund | null> {
    return Refund.findOne({ refundId }).exec();
  }

  async findByIdPopulated(id: string): Promise<IRefund | null> {
    return Refund.findById(id).populate(refundPopulate).exec();
  }

  async listForUser(userId: string, options: { page?: number; limit?: number }) {
    return this.paginate({ user: userId as unknown as Types.ObjectId }, options);
  }

  async listForOwner(ownerId: string, options: { page?: number; limit?: number }) {
    return this.paginate({ owner: ownerId as unknown as Types.ObjectId }, options);
  }

  async listAll(options: { page?: number; limit?: number; status?: string }) {
    const filter: FilterQuery<IRefund> = {};
    if (options.status) filter.status = options.status as IRefund['status'];
    return this.paginate(filter, options);
  }

  private async paginate(filter: FilterQuery<IRefund>, options: { page?: number; limit?: number }) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;
    const total = await this.countDocuments(filter);
    const data = await this.find(filter, {
      populate: refundPopulate,
      sort: { createdAt: -1 as 1 | -1 },
      skip,
      limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}

export default new RefundRepository();
