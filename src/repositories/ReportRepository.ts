import { FilterQuery, PopulateOptions, Types } from 'mongoose';
import Report, { IReport } from '../models/Report';
import BaseRepository from './BaseRepository';

const reportPopulate: PopulateOptions[] = [
  { path: 'reporter', select: 'name email avatar' },
  { path: 'resolvedBy', select: 'name email' },
];

class ReportRepository extends BaseRepository<IReport> {
  constructor() {
    super(Report);
  }

  async listAll(options: { page?: number; limit?: number; status?: string }) {
    const filter: FilterQuery<IReport> = {};
    if (options.status) filter.status = options.status as IReport['status'];
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;
    const total = await this.countDocuments(filter);
    const data = await this.find(filter, {
      populate: reportPopulate,
      sort: { createdAt: -1 as 1 | -1 },
      skip,
      limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findByUser(userId: string): Promise<IReport[]> {
    return this.find(
      { reporter: userId as unknown as Types.ObjectId },
      { populate: reportPopulate, sort: { createdAt: -1 as 1 | -1 } }
    );
  }
}

export default new ReportRepository();

