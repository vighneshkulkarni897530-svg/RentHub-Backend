import { FilterQuery, PopulateOptions, Types } from 'mongoose';
import Product, { IProduct } from '../models/Product';
import BaseRepository from './BaseRepository';

const productPopulate: PopulateOptions[] = [
  { path: 'category', select: 'name slug icon image' },
  { path: 'owner', select: 'name avatar rating storeName' },
];

class ProductRepository extends BaseRepository<IProduct> {
  constructor() {
    super(Product);
  }

  async findBySlug(slug: string): Promise<IProduct | null> {
    return Product.findOne({ slug }).populate(productPopulate).exec();
  }

  async findByIdPopulated(id: string): Promise<IProduct | null> {
    return Product.findById(id).populate(productPopulate).exec();
  }

  async listProducts(filter: FilterQuery<IProduct> = {}, options: { page?: number; limit?: number; sort?: string; search?: string } = {}) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    let query: FilterQuery<IProduct> = { ...filter };

    if (options.search) {
      query.$text = { $search: options.search };
    }

    const sort: Record<string, 1 | -1> =
      options.sort === 'price_asc'
        ? { rentalPrice: 1 }
        : options.sort === 'price_desc'
        ? { rentalPrice: -1 }
        : options.sort === 'rating'
        ? { rating: -1 }
        : options.sort === 'trending'
        ? { isTrending: -1, bookingsCount: -1, rating: -1, createdAt: -1 }
        : options.sort === 'newest'
        ? { createdAt: -1 }
        : { createdAt: -1 };

    const total = await this.countDocuments(query);
    const data = await this.find(query, { populate: productPopulate, sort, skip, limit });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    };
  }

  async incrementStat(id: string, field: 'bookingsCount' | 'totalRevenue' | 'reviewCount', amount = 1): Promise<void> {
    await Product.updateOne({ _id: id }, { $inc: { [field]: amount } }).exec();
  }

  async updateRating(id: string): Promise<void> {
    // Imported lazily to avoid circular dependency issues
    const Review = (await import('../models/Review')).default;
    const result = await Review.aggregate([
      { $match: { product: new Types.ObjectId(id) } },
      { $group: { _id: '$product', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    if (result.length) {
      await Product.updateOne(
        { _id: id },
        { $set: { rating: Math.round(result[0].avg * 10) / 10, reviewCount: result[0].count } }
      ).exec();
    }
  }
}

export default new ProductRepository();

