import { FilterQuery, PopulateOptions, Types } from 'mongoose';
import SupportTicket, { ISupportTicket } from '../models/SupportTicket';
import BaseRepository from './BaseRepository';

const ticketPopulate: PopulateOptions[] = [
  { path: 'user', select: 'name email avatar' },
  { path: 'assignedTo', select: 'name email' },
];

class SupportTicketRepository extends BaseRepository<ISupportTicket> {
  constructor() {
    super(SupportTicket);
  }

  async listAll(options: { page?: number; limit?: number; status?: string }) {
    const filter: FilterQuery<ISupportTicket> = {};
    if (options.status) filter.status = options.status as ISupportTicket['status'];
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;
    const total = await this.countDocuments(filter);
    const data = await this.find(filter, {
      populate: ticketPopulate,
      sort: { updatedAt: -1 as 1 | -1 },
      skip,
      limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findByUser(userId: string): Promise<ISupportTicket[]> {
    return this.find(
      { user: userId as unknown as Types.ObjectId },
      { populate: ticketPopulate, sort: { updatedAt: -1 as 1 | -1 } }
    );
  }

  async findByIdPopulated(id: string): Promise<ISupportTicket | null> {
    return this.findById(id, ticketPopulate);
  }
}

export default new SupportTicketRepository();

