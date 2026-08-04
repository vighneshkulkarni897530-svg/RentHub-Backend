import { FilterQuery, PopulateOptions, Types } from 'mongoose';
import Review, { IReview } from '../models/Review';
import BaseRepository from './BaseRepository';

const reviewPopulate: PopulateOptions[] = [
  { path: 'product', select: 'title slug images owner' },
  { path: 'user', select: 'name avatar rating' },
];

class ReviewRepository extends BaseRepository<IReview> {
  constructor() {
    super(Review);
  }

  async findByProduct(productId: string, options: { page?: number; limit?: number }) {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;
    const filter: FilterQuery<IReview> = { product: productId as unknown as Types.ObjectId };
    const total = await this.countDocuments(filter);
    const data = await this.find(filter, {
      populate: [{ path: 'user', select: 'name avatar rating' }],
      sort: { createdAt: -1 as 1 | -1 },
      skip,
      limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findByUser(userId: string) {
    return this.find(
      { user: userId as unknown as Types.ObjectId },
      { populate: reviewPopulate, sort: { createdAt: -1 as 1 | -1 } }
    );
  }

  async findByOwnerProducts(ownerId: string) {
    // Reviews for all products owned by a specific owner
    const products = await this.model.db
      .model('Product')
      .find({ owner: ownerId as unknown as Types.ObjectId })
      .select('_id')
      .exec();
    const productIds = products.map((p: any) => p._id);
    return this.find(
      { product: { $in: productIds } },
      { populate: reviewPopulate, sort: { createdAt: -1 as 1 | -1 } }
    );
  }
}

export default new ReviewRepository();

