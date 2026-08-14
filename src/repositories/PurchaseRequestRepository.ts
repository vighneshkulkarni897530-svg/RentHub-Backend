import { FilterQuery, PopulateOptions } from 'mongoose';
import PurchaseRequest, { IPurchaseRequest, PurchaseRequestStatus } from '../models/PurchaseRequest';
import BaseRepository from './BaseRepository';

const purchaseRequestPopulate: PopulateOptions[] = [
  { path: 'product', select: 'title slug images salePrice saleEnabled rentalPrice priceUnit' },
  { path: 'renter', select: 'name avatar phone email rating' },
  { path: 'owner', select: 'name avatar phone email rating' },
  { path: 'rentalId', select: 'startDate endDate status totalPrice' },
];

class PurchaseRequestRepository extends BaseRepository<IPurchaseRequest> {
  constructor() {
    super(PurchaseRequest);
  }

  async findByIdPopulated(id: string): Promise<IPurchaseRequest | null> {
    return PurchaseRequest.findById(id).populate(purchaseRequestPopulate).exec();
  }

  async listForRenter(
    renterId: string,
    options: { page?: number; limit?: number; status?: string }
  ) {
    const filter: FilterQuery<IPurchaseRequest> = { renter: renterId as any };
    if (options.status) filter.status = options.status as PurchaseRequestStatus;
    return this.paginate(filter, options);
  }

  async listForOwner(
    ownerId: string,
    options: { page?: number; limit?: number; status?: string }
  ) {
    const filter: FilterQuery<IPurchaseRequest> = { owner: ownerId as any };
    if (options.status) filter.status = options.status as PurchaseRequestStatus;
    return this.paginate(filter, options);
  }

  async findActivePendingProductRequest(productId: string, renterId: string): Promise<IPurchaseRequest | null> {
    return PurchaseRequest.findOne({
      product: productId as any,
      renter: renterId as any,
      status: { $in: ['pending', 'accepted'] },
    }).exec();
  }

  private async paginate(filter: FilterQuery<IPurchaseRequest>, options: { page?: number; limit?: number; status?: string }) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;
    const total = await this.countDocuments(filter);
    const data = await this.find(filter, {
      populate: purchaseRequestPopulate,
      sort: { createdAt: -1 as 1 | -1 },
      skip,
      limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}

export default new PurchaseRequestRepository();