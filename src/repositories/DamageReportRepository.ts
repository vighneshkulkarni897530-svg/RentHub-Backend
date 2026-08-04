import { FilterQuery, PopulateOptions } from 'mongoose';
import DamageReport, { IDamageReport } from '../models/DamageReport';
import BaseRepository from './BaseRepository';

const damagePopulate: PopulateOptions[] = [
  { path: 'booking', select: 'startDate endDate status totalPrice deliveryOption' },
  { path: 'product', select: 'title slug images rentalPrice priceUnit' },
  { path: 'owner', select: 'name email avatar' },
  { path: 'renter', select: 'name email avatar' },
  { path: 'reporter', select: 'name email avatar' },
];

class DamageReportRepository extends BaseRepository<IDamageReport> {
  constructor() {
    super(DamageReport);
  }

  async findByBooking(bookingId: string) {
    return this.find({ booking: bookingId as any }, { populate: damagePopulate, sort: { createdAt: -1 as 1 | -1 } });
  }

  async listForUser(userId: string) {
    return this.find({ $or: [{ renter: userId as any }, { owner: userId as any }, { reporter: userId as any }] }, {
      populate: damagePopulate,
      sort: { createdAt: -1 as 1 | -1 },
    });
  }

  async listAll(options: { page?: number; limit?: number; status?: string } = {}) {
    const filter: FilterQuery<IDamageReport> = {};
    if (options.status) filter.status = options.status as IDamageReport['status'];
    return this.find(filter, {
      populate: damagePopulate,
      skip: ((options.page || 1) - 1) * (options.limit || 20),
      limit: options.limit || 20,
      sort: { createdAt: -1 as 1 | -1 },
    });
  }
}

export default new DamageReportRepository();
