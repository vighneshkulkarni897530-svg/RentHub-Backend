import { FilterQuery, Types } from 'mongoose';
import ProductImage, { IProductImage } from '../models/ProductImage';
import BaseRepository from './BaseRepository';

class ProductImageRepository extends BaseRepository<IProductImage> {
  constructor() {
    super(ProductImage);
  }

  async findByProduct(productId: string): Promise<IProductImage[]> {
    return this.find(
      { product: productId as unknown as Types.ObjectId },
      { sort: { sortOrder: 1 as 1 | -1 } }
    );
  }

  async deleteForProduct(productId: string): Promise<void> {
    await this.deleteMany({ product: productId as unknown as Types.ObjectId } as FilterQuery<IProductImage>);
  }
}

export default new ProductImageRepository();

