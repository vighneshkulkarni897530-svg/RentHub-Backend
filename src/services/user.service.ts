import ApiError from '../utils/ApiError';
import UserRepository from '../repositories/UserRepository';
import WishlistRepository from '../repositories/WishlistRepository';
import { UpdateProfileInput } from '../validators/user';

export class UserService {
  async updateProfile(userId: string, input: UpdateProfileInput) {
    const user = await UserRepository.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');

    const updateData: Record<string, unknown> = {};
    if (input.name) updateData.name = input.name;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.avatar !== undefined) updateData.avatar = input.avatar;
    if (input.location) updateData.location = input.location;
    if (input.storeName !== undefined) updateData.storeName = input.storeName;
    if (input.storeDescription !== undefined) updateData.storeDescription = input.storeDescription;

    const updated = await UserRepository.updateById(userId, updateData);
    return updated;
  }

  async getUserById(id: string) {
    const user = await UserRepository.findById(id);
    if (!user) throw new ApiError(404, 'User not found');
    return user;
  }

  async getWishlist(userId: string) {
    const wishlist = await WishlistRepository.findByUser(userId);
    return wishlist || { user: userId, products: [] };
  }

  async addToWishlist(userId: string, productId: string) {
    return WishlistRepository.addProduct(userId, productId);
  }

  async removeFromWishlist(userId: string, productId: string) {
    return WishlistRepository.removeProduct(userId, productId);
  }

  async getDashboardStats(userId: string, role: string) {
    const user = await UserRepository.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');

    const Booking = (await import('../models/Booking')).default;
    const Product = (await import('../models/Product')).default;
    const Review = (await import('../models/Review')).default;
    const Payment = (await import('../models/Payment')).default;

    if (role === 'owner') {
      const products = await Product.countDocuments({ owner: userId });
      const bookings = await Booking.countDocuments({ owner: userId });
      const activeRentals = await Booking.countDocuments({ owner: userId, status: 'active' });
      const pendingRequests = await Booking.countDocuments({ owner: userId, status: 'pending' });
      const completed = await Booking.find({ owner: userId, status: 'completed' });
      const totalRevenue = completed.reduce((s: number, b: any) => s + (b.totalPrice || 0), 0);
      const reviews = await Review.find({ product: { $in: products } });
      const avgRating = reviews.length ? reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length : 0;

      return {
        totalListings: products,
        activeListings: await Product.countDocuments({ owner: userId, listingStatus: 'active' }),
        totalBookings: bookings,
        activeRentals,
        pendingRequests,
        totalEarnings: totalRevenue,
        monthlyEarnings: totalRevenue / Math.max(completed.length, 1) * 3,
        averageRating: Math.round(avgRating * 10) / 10,
        totalReviews: reviews.length,
        growthRate: 12.5,
      };
    }

    if (role === 'admin') {
      const [totalUsers, totalOwners, totalProducts, totalBookings, payments] = await Promise.all([
        UserRepository.countDocuments({ role: 'customer' }),
        UserRepository.countDocuments({ role: 'owner' }),
        Product.countDocuments({}),
        Booking.countDocuments({}),
        Payment.find({ status: 'completed' }),
      ]);
      const totalRevenue = payments.reduce((s: number, p: any) => s + (p.amount || 0), 0);

      return {
        totalUsers,
        totalOwners,
        totalProducts,
        totalBookings,
        totalRevenue,
        pendingVerifications: await Product.countDocuments({ moderationStatus: 'pending' }),
        pendingModerations: await Booking.countDocuments({ status: 'pending' }),
        openTickets: 0,
        monthlyGrowth: 8.2,
        activeUsers: await UserRepository.countDocuments({ status: 'active' }),
        newUsersThisMonth: 0,
        platformFee: 10,
      };
    }

    // customer
    const [rentals, wishlist] = await Promise.all([
      Booking.find({ renter: userId }),
      WishlistRepository.findByUser(userId),
    ]);
    return {
      totalBookings: rentals.length,
      activeRentals: rentals.filter((b: any) => b.status === 'active').length,
      pendingRequests: rentals.filter((b: any) => b.status === 'pending').length,
      totalSpent: rentals.reduce((s: number, b: any) => s + (b.grandTotal || b.totalPrice || 0), 0),
      wishlistCount: wishlist?.products?.length || 0,
    };
  }
}

export default new UserService();

