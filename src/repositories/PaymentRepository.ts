import { FilterQuery, PopulateOptions } from 'mongoose';
import Payment, { IPayment } from '../models/Payment';
import BaseRepository from './BaseRepository';

const paymentPopulate: PopulateOptions[] = [
  { path: 'booking', select: 'startDate endDate totalPrice status product' },
  { path: 'user', select: 'name email avatar' },
  { path: 'owner', select: 'name email avatar' },
];

class PaymentRepository extends BaseRepository<IPayment> {
  constructor() {
    super(Payment);
  }

  async findByTransactionId(transactionId: string): Promise<IPayment | null> {
    return Payment.findOne({ transactionId }).exec();
  }

  async findByRazorpayOrderId(orderId: string): Promise<IPayment | null> {
    return Payment.findOne({ razorpayOrderId: orderId }).exec();
  }

  async listForUser(userId: string, options: { page?: number; limit?: number }) {
    return this.paginate({ user: userId }, options);
  }

  async listForOwner(ownerId: string, options: { page?: number; limit?: number }) {
    return this.paginate({ owner: ownerId }, options);
  }

  async listAll(options: { page?: number; limit?: number; status?: string }) {
    const filter: FilterQuery<IPayment> = {};
    if (options.status) filter.status = options.status as IPayment['status'];
    return this.paginate(filter, options);
  }

  private async paginate(filter: FilterQuery<IPayment>, options: { page?: number; limit?: number }) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;
    const total = await this.countDocuments(filter);
    const data = await this.find(filter, {
      populate: paymentPopulate,
      sort: { createdAt: -1 as 1 | -1 },
      skip,
      limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async sumRevenue(): Promise<number> {
    const result = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    return result.length ? result[0].total : 0;
  }
}

export default new PaymentRepository();

