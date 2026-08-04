import ApiError from '../utils/ApiError';
import WishlistRepository from '../repositories/WishlistRepository';
import ProductRepository from '../repositories/ProductRepository';

export class WishlistService {
  async getWishlist(userId: string) {
    const wishlist = await WishlistRepository.findByUser(userId);
    return wishlist || { user: userId, products: [] };
  }

  async addProduct(userId: string, productId: string) {
    const product = await ProductRepository.findById(productId);
    if (!product) throw new ApiError(404, 'Product not found');
    return WishlistRepository.addProduct(userId, productId);
  }

  async removeProduct(userId: string, productId: string) {
    const wishlist = await WishlistRepository.findByUser(userId);
    if (!wishlist) throw new ApiError(404, 'Wishlist not found');
    return WishlistRepository.removeProduct(userId, productId);
  }

  async isInWishlist(userId: string, productId: string): Promise<boolean> {
    const wishlist = await WishlistRepository.findByUser(userId);
    return wishlist ? wishlist.products.some((p: any) => p._id.toString() === productId) : false;
  }
}

export default new WishlistService();

