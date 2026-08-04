import { PopulateOptions } from 'mongoose';
import Wishlist, { IWishlist } from '../models/Wishlist';
import BaseRepository from './BaseRepository';

const wishlistPopulate: PopulateOptions[] = [
  {
    path: 'products',
    select: 'title slug images rentalPrice priceUnit rating reviewCount condition location',
    populate: { path: 'category', select: 'name slug' },
  },
];

class WishlistRepository extends BaseRepository<IWishlist> {
  constructor() {
    super(Wishlist);
  }

  async findByUser(userId: string): Promise<IWishlist | null> {
    return Wishlist.findOne({ user: userId }).populate(wishlistPopulate).exec();
  }

  async addProduct(userId: string, productId: string): Promise<IWishlist> {
    return Wishlist.findOneAndUpdate(
      { user: userId },
      { $addToSet: { products: productId } },
      { new: true, upsert: true, runValidators: true }
    )
      .populate(wishlistPopulate)
      .exec();
  }

  async removeProduct(userId: string, productId: string): Promise<IWishlist | null> {
    return Wishlist.findOneAndUpdate(
      { user: userId },
      { $pull: { products: productId } },
      { new: true, runValidators: true }
    )
      .populate(wishlistPopulate)
      .exec();
  }
}

export default new WishlistRepository();

