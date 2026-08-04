import { FilterQuery, PopulateOptions, Types } from 'mongoose';
import OwnerVerification, { IOwnerVerification } from '../models/OwnerVerification';
import BaseRepository from './BaseRepository';

const verifyPopulate: PopulateOptions[] = [
  { path: 'user', select: 'name email avatar phone' },
  { path: 'reviewedBy', select: 'name email' },
];

class OwnerVerificationRepository extends BaseRepository<IOwnerVerification> {
  constructor() {
    super(OwnerVerification);
  }

  async findByUser(userId: string): Promise<IOwnerVerification | null> {
    return OwnerVerification.findOne({ user: userId }).populate(verifyPopulate).exec();
  }

  async listAll(options: { page?: number; limit?: number; status?: string }) {
    const filter: FilterQuery<IOwnerVerification> = {};
    if (options.status) filter.status = options.status as IOwnerVerification['status'];
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;
    const total = await this.countDocuments(filter);
    const data = await this.find(filter, {
      populate: verifyPopulate,
      sort: { createdAt: -1 as 1 | -1 },
      skip,
      limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findByUserIdRaw(userId: string): Promise<IOwnerVerification | null> {
    return OwnerVerification.findOne({ user: userId }).exec();
  }
}

export default new OwnerVerificationRepository();

