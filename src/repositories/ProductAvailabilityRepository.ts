import { Types } from 'mongoose';
import ProductAvailability, { IProductAvailability } from '../models/ProductAvailability';
import BaseRepository from './BaseRepository';

class ProductAvailabilityRepository extends BaseRepository<IProductAvailability> {
  constructor() {
    super(ProductAvailability);
  }

  async findByProduct(productId: string): Promise<IProductAvailability[]> {
    return this.find(
      { product: productId as unknown as Types.ObjectId },
      { sort: { startDate: 1 as 1 | -1 } }
    );
  }

  async findConflicts(productId: string, startDate: Date, endDate: Date): Promise<IProductAvailability[]> {
    return this.find({
      product: productId as unknown as Types.ObjectId,
      startDate: { $lt: endDate },
      endDate: { $gt: startDate },
    });
  }
}

export default new ProductAvailabilityRepository();

