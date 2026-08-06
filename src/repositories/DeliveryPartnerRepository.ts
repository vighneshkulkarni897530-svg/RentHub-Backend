import { FilterQuery } from 'mongoose';
import DeliveryPartner, { IDeliveryPartner } from '../models/DeliveryPartner';
import BaseRepository from './BaseRepository';

class DeliveryPartnerRepository extends BaseRepository<IDeliveryPartner> {
  constructor() {
    super(DeliveryPartner);
  }

  async listAvailable(options: { page?: number; limit?: number; zone?: string }) {
    const filter: FilterQuery<IDeliveryPartner> = { status: 'active' };
    if (options.zone) filter.zones = options.zone;
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;
    const total = await this.countDocuments(filter);
    const data = await this.find(filter, {
      sort: { rating: -1 as 1 | -1 },
      skip,
      limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async listAll(options: { page?: number; limit?: number; status?: string }) {
    const filter: FilterQuery<IDeliveryPartner> = {};
    if (options.status) filter.status = options.status as IDeliveryPartner['status'];
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;
    const total = await this.countDocuments(filter);
    const data = await this.find(filter, {
      sort: { createdAt: -1 as 1 | -1 },
      skip,
      limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}

export default new DeliveryPartnerRepository();
