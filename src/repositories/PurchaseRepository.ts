import { FilterQuery, PopulateOptions } from 'mongoose';
import Purchase, { IPurchase, PurchaseStatus } from '../models/Purchase';
import BaseRepository from './BaseRepository';

const purchasePopulate: PopulateOptions[] = [
  { path: 'product', select: 'title slug images salePrice saleEnabled rentalPrice priceUnit' },
  { path: 'buyer', select: 'name avatar phone email rating' },
  { path: 'owner', select: 'name avatar phone email rating' },
  { path: 'rentalId', select: 'startDate endDate status totalPrice' },
];

class PurchaseRepository extends BaseRepository<IPurchase> {
  constructor() {
    super(Purchase);
  }

  async findByIdPopulated(id: string): Promise<IPurchase | null> {
    return Purchase.findById(id).populate(purchasePopulate).exec();
  }

  async listForBuyer(
    buyerId: string,
    options: { page?: number; limit?: number; status?: string }
  ) {
    const filter: FilterQuery<IPurchase> = { buyer: buyerId as any };
    if (options.status) filter.status = options.status as PurchaseStatus;
    return this.paginate(filter, options);
  }

  async listForOwner(
    ownerId: string,
    options: { page?: number; limit?: number; status?: string }
  ) {
    const filter: FilterQuery<IPurchase> = { owner: ownerId as any };
    if (options.status) filter.status = options.status as PurchaseStatus;
    return this.paginate(filter, options);
  }

  async findSoldByProduct(productId: string): Promise<IPurchase | null> {
    return Purchase.findOne({ product: productId as any, status: { $in: ['confirmed', 'pending'] } }).exec();
  }

  private async paginate(filter: FilterQuery<IPurchase>, options: { page?: number; limit?: number; status?: string }) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;
    const total = await this.countDocuments(filter);
    const data = await this.find(filter, {
      populate: purchasePopulate,
      sort: { createdAt: -1 as 1 | -1 },
      skip,
      limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}

export default new PurchaseRepository();