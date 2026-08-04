import { FilterQuery, PopulateOptions } from 'mongoose';
import Coupon, { ICoupon } from '../models/Coupon';
import BaseRepository from './BaseRepository';

const couponPopulate: PopulateOptions[] = [
  { path: 'ownerId', select: 'name email' },
  { path: 'categoryIds', select: 'slug name' },
  { path: 'productIds', select: 'title slug' },
];

class CouponRepository extends BaseRepository<ICoupon> {
  constructor() {
    super(Coupon);
  }

  async findByCode(code: string) {
    return Coupon.findOne({ code: code.toUpperCase(), isActive: true }).exec();
  }

  async listAll(options: { page?: number; limit?: number; active?: boolean } = {}) {
    const filter: FilterQuery<ICoupon> = {};
    if (options.active !== undefined) filter.isActive = options.active;
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;
    const total = await this.countDocuments(filter);
    const data = await this.find(filter, {
      populate: couponPopulate,
      sort: { createdAt: -1 as 1 | -1 },
      skip,
      limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}

export default new CouponRepository();
