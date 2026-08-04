import { FilterQuery, PopulateOptions } from 'mongoose';
import KycVerification, { IKycVerification } from '../models/KycVerification';
import BaseRepository from './BaseRepository';

class KycVerificationRepository extends BaseRepository<IKycVerification> {
  constructor() {
    super(KycVerification);
  }

  async findByUserId(userId: string): Promise<IKycVerification | null> {
    return this.findOne({ user: userId });
  }

  async listAll(options: { page?: number; limit?: number; status?: string; role?: string } = {}) {
    const filter: FilterQuery<IKycVerification> = {};
    if (options.status) filter.status = options.status as IKycVerification['status'];
    if (options.role) filter.role = options.role as IKycVerification['role'];
    return this.find(filter, {
      sort: { createdAt: -1 as 1 | -1 },
      skip: ((options.page || 1) - 1) * (options.limit || 20),
      limit: options.limit || 20,
    });
  }
}

export default new KycVerificationRepository();
