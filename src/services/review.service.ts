import ApiError from '../utils/ApiError';
import ReviewRepository from '../repositories/ReviewRepository';
import BookingRepository from '../repositories/BookingRepository';
import ProductRepository from '../repositories/ProductRepository';
import notificationService from './notification.service';
import { CreateReviewInput } from '../validators/review';

export class ReviewService {
  async createReview(userId: string, productId: string, input: CreateReviewInput) {
    const product = await ProductRepository.findById(productId);
    if (!product) throw new ApiError(404, 'Product not found');
    if (product.owner.toString() === userId) {
      throw new ApiError(400, 'You cannot review your own product');
    }

    // Check user has a completed booking for this product (verified review)
    const existingBooking = input.booking
      ? await BookingRepository.findById(input.booking)
      : null;

    let isVerified = false;
    if (existingBooking) {
      const booking = existingBooking as any;
      const productMatch = booking.product.toString() === productId;
      const renterMatch = booking.renter.toString() === userId;
      isVerified = productMatch && renterMatch && ['completed', 'active'].includes(booking.status);
    } else {
      // Fallback: check for any completed booking
      const bookings = await BookingRepository.find({
        product: productId as any,
        renter: userId as any,
        status: { $in: ['completed', 'active'] },
      });
      isVerified = bookings.length > 0;
    }

    const review = await ReviewRepository.create({
      product: productId as any,
      booking: input.booking ? (input.booking as any) : undefined,
      user: userId as any,
      rating: input.rating,
      comment: input.comment,
      isVerified,
    });

    // Update product rating
    await ProductRepository.updateRating(productId);

    void notificationService.createNotification({
      userId: product.owner.toString(),
      type: 'review',
      title: 'New review',
      message: `Your product "${product.title}" received a ${input.rating}-star review`,
      link: `/owner/reviews`,
    });

    return review;
  }

  async getProductReviews(productId: string, options: any) {
    return ReviewRepository.findByProduct(productId, options);
  }

  async getMyReviews(userId: string) {
    return ReviewRepository.findByUser(userId);
  }

  async respondToReview(reviewId: string, ownerId: string, response: string) {
    const review = await ReviewRepository.findById(reviewId);
    if (!review) throw new ApiError(404, 'Review not found');

    const product = await ProductRepository.findById(review.product.toString());
    if (!product || product.owner.toString() !== ownerId) {
      throw new ApiError(403, 'You can only respond to reviews on your own products');
    }

    return ReviewRepository.updateById(reviewId, {
      response,
      respondedBy: ownerId as any,
      respondedAt: new Date(),
    });
  }
}

export default new ReviewService();

