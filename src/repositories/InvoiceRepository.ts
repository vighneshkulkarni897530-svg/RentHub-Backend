import { FilterQuery, PopulateOptions, Types } from 'mongoose';
import Invoice, { IInvoice } from '../models/Invoice';
import BaseRepository from './BaseRepository';

const invoicePopulate: PopulateOptions[] = [
  { path: 'booking', select: 'startDate endDate totalPrice status' },
  { path: 'user', select: 'name email avatar' },
  { path: 'owner', select: 'name email avatar' },
];

class InvoiceRepository extends BaseRepository<IInvoice> {
  constructor() {
    super(Invoice);
  }

  async findByInvoiceNumber(invoiceNumber: string): Promise<IInvoice | null> {
    return Invoice.findOne({ invoiceNumber }).exec();
  }

  async findByIdPopulated(id: string): Promise<IInvoice | null> {
    return Invoice.findById(id).populate(invoicePopulate).exec();
  }

  async listForUser(userId: string, options: { page?: number; limit?: number }) {
    return this.paginate({ user: userId as unknown as Types.ObjectId }, options);
  }

  async listForOwner(ownerId: string, options: { page?: number; limit?: number }) {
    return this.paginate({ owner: ownerId as unknown as Types.ObjectId }, options);
  }

  async listAll(options: { page?: number; limit?: number }) {
    return this.paginate({}, options);
  }

  private async paginate(filter: FilterQuery<IInvoice>, options: { page?: number; limit?: number }) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;
    const total = await this.countDocuments(filter);
    const data = await this.find(filter, {
      populate: invoicePopulate,
      sort: { createdAt: -1 as 1 | -1 },
      skip,
      limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}

export default new InvoiceRepository();
