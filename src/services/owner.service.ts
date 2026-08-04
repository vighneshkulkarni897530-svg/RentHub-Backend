import ApiError from '../utils/ApiError';
import UserRepository from '../repositories/UserRepository';
import ProductRepository from '../repositories/ProductRepository';
import BookingRepository from '../repositories/BookingRepository';
import ReviewRepository from '../repositories/ReviewRepository';
import PaymentRepository from '../repositories/PaymentRepository';
import notificationService from './notification.service';
import KycService from './kyc.service';

export class OwnerService {
  async getOwnerStats(ownerId: string) {
    const products = await ProductRepository.find({ owner: ownerId as any });
    const productIds = products.map((p: any) => p._id);
    const bookings = await BookingRepository.find({ owner: ownerId as any });
    const completed = bookings.filter((b: any) => b.status === 'completed');
    const totalRevenue = completed.reduce((s: number, b: any) => s + (b.grandTotal || b.totalPrice || 0), 0);
    const reviews = await ReviewRepository.find({ product: { $in: productIds } });
    const avgRating = reviews.length ? reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length : 0;

    return {
      totalListings: products.length,
      activeListings: products.filter((p: any) => p.listingStatus === 'active').length,
      totalBookings: bookings.length,
      activeRentals: bookings.filter((b: any) => b.status === 'active').length,
      pendingRequests: bookings.filter((b: any) => b.status === 'pending').length,
      totalEarnings: totalRevenue,
      monthlyEarnings: totalRevenue / Math.max(completed.length, 1) * 3,
      averageRating: Math.round(avgRating * 10) / 10,
      totalReviews: reviews.length,
      growthRate: 12.5,
    };
  }

  async getOwnerListings(ownerId: string) {
    return ProductRepository.find(
      { owner: ownerId as any },
      { sort: { createdAt: -1 as 1 | -1 }, populate: { path: 'category', select: 'name slug' } }
    );
  }

  async getOwnerBookings(ownerId: string, options: any) {
    return BookingRepository.listForOwner(ownerId, options);
  }

  async getOwnerReviews(ownerId: string) {
    return ReviewRepository.findByOwnerProducts(ownerId);
  }

  async getOwnerEarnings(ownerId: string) {
    const payments = await PaymentRepository.find({ owner: ownerId, status: 'completed' });
    const total = payments.reduce((s: number, p: any) => s + (p.netAmount || p.amount || 0), 0);
    return { total, count: payments.length };
  }

  async submitVerification(userId: string, input: { storeName: string; storeDescription: string; documentType: string; documentUrls: string[] }) {
    const verification = await KycService.submitVerification(userId, 'owner', {
      documentType: input.documentType as any,
      documentUrls: input.documentUrls,
    });
 
    await UserRepository.updateById(userId, {
      storeName: input.storeName,
      storeDescription: input.storeDescription,
    });
 
    return verification;
  }
 
  async getVerificationStatus(userId: string) {
    return KycService.getVerificationStatus(userId) || null;
  }

  async reviewVerification(verificationId: string, adminId: string, status: 'verified' | 'rejected', note?: string) {
    return KycService.reviewVerification(verificationId, adminId, status as any, note);
  }
}

export default new OwnerService();

