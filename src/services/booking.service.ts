import ApiError from '../utils/ApiError';
import BookingRepository from '../repositories/BookingRepository';
import ProductRepository from '../repositories/ProductRepository';
import ProductAvailabilityRepository from '../repositories/ProductAvailabilityRepository';
import notificationService from './notification.service';
import couponService from './coupon.service';
import { CreateBookingInput } from '../validators/booking';

const PLATFORM_FEE_PERCENT = 0.1; // 10%

export class BookingService {
  async createBooking(renterId: string, input: CreateBookingInput) {
    const product = await ProductRepository.findById(input.product);
    if (!product) throw new ApiError(404, 'Product not found');
    if (product.listingStatus !== 'active') throw new ApiError(400, 'This product is not available for rent');
    if (product.owner.toString() === renterId) {
      throw new ApiError(400, 'You cannot book your own product');
    }

    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);
    if (startDate >= endDate) throw new ApiError(400, 'End date must be after start date');

    // Check for overlapping bookings
    const overlapping = await BookingRepository.findOverlapping(input.product, startDate, endDate);
    if (overlapping.length) {
      throw new ApiError(409, 'Product is already booked for the selected dates');
    }

    // Check blocked dates
    const blocked = await ProductAvailabilityRepository.findConflicts(input.product, startDate, endDate);
    if (blocked.length) {
      throw new ApiError(409, 'Product is unavailable for the selected dates');
    }

    const platformFee = Math.round(input.totalPrice * PLATFORM_FEE_PERCENT * 100) / 100;
    const grandTotal = Math.round((input.totalPrice + platformFee + (input.deliveryFee || 0)) * 100) / 100;

    let couponCode: string | undefined;
    let couponDiscount = 0;
    let couponType: 'fixed' | 'percentage' = 'fixed';

    if (input.couponCode) {
      const couponResult = await couponService.applyCoupon({
        couponCode: input.couponCode,
        productId: input.product,
        totalPrice: input.totalPrice,
      });
      couponCode = couponResult.couponCode;
      couponDiscount = couponResult.couponDiscount;
      couponType = couponResult.couponType as 'fixed' | 'percentage';
      await couponService.redeemCoupon(couponResult.couponCode);
    }

    const booking = await BookingRepository.create({
      product: input.product as any,
      renter: renterId as any,
      owner: product.owner,
      startDate,
      endDate,
      duration: input.duration,
      durationUnit: input.durationUnit,
      totalPrice: input.totalPrice,
      securityDeposit: input.securityDeposit || product.securityDeposit,
      deliveryFee: input.deliveryFee || 0,
      platformFee,
      couponCode,
      couponDiscount,
      couponType,
      grandTotal: Math.round((input.totalPrice - couponDiscount + platformFee + (input.deliveryFee || 0)) * 100) / 100,
      deliveryOption: input.deliveryOption,
      deliveryAddress: input.deliveryAddress,
      notes: input.notes,
      status: 'pending',
      paymentStatus: 'pending',
    });

    // Notify the owner
    void notificationService.notifyBookingCreated({
      userId: product.owner.toString(),
      title: 'New booking request',
      message: `You have a new booking request for ${product.title}`,
      link: `/owner/booking-requests`,
    });

    return BookingRepository.findByIdPopulated(booking.id);
  }

  async listMyBookings(userId: string, options: any) {
    return BookingRepository.listForUser(userId, options);
  }

  async getBookingById(id: string, userId?: string) {
    const booking = await BookingRepository.findByIdPopulated(id);
    if (!booking) throw new ApiError(404, 'Booking not found');

    if (userId) {
      const isOwner = booking.owner._id.toString() === userId;
      const isRenter = booking.renter._id.toString() === userId;
      if (!isOwner && !isRenter) throw new ApiError(403, 'You do not have access to this booking');
    }
    return booking;
  }

  async updateBookingStatus(id: string, userId: string, status: string, reason?: string) {
    const booking = await BookingRepository.findByIdPopulated(id);
    if (!booking) throw new ApiError(404, 'Booking not found');

    const isOwner = booking.owner._id.toString() === userId;
    const isRenter = booking.renter._id.toString() === userId;

    // Owners can confirm/decline pending bookings
    if (isOwner && ['confirmed', 'declined'].includes(status)) {
      // only allow confirming if pending
      if (status === 'confirmed' && booking.status !== 'pending') {
        throw new ApiError(400, 'Only pending bookings can be confirmed');
      }
      if (status === 'declined') {
        await BookingRepository.updateById(id, {
          status,
          cancellationReason: reason || 'Booking declined by owner',
        });
        return BookingRepository.findByIdPopulated(id);
      }
    }

    // Renters can cancel
    if (isRenter && status === 'cancelled') {
      if (!['pending', 'confirmed'].includes(booking.status)) {
        throw new ApiError(400, 'Booking cannot be cancelled at this stage');
      }
      await BookingRepository.updateById(id, {
        status,
        cancellationReason: reason || 'Cancelled by renter',
      });
      return BookingRepository.findByIdPopulated(id);
    }

    // System-level transitions for owner: pending -> confirmed -> active -> completed
    if (isOwner && booking.status === 'confirmed' && status === 'active') {
      await BookingRepository.updateById(id, { status });
      return BookingRepository.findByIdPopulated(id);
    }
    if (isOwner && booking.status === 'active' && status === 'completed') {
      await BookingRepository.updateById(id, { status });
      // Increment product booking counters
      await ProductRepository.incrementStat(booking.product._id.toString(), 'bookingsCount');
      return BookingRepository.findByIdPopulated(id);
    }

    throw new ApiError(400, `Cannot transition booking from "${booking.status}" to "${status}"`);
  }

  async cancelBooking(id: string, renterId: string, reason?: string) {
    const booking = await BookingRepository.findByIdPopulated(id);
    if (!booking) throw new ApiError(404, 'Booking not found');
    if (booking.renter._id.toString() !== renterId) {
      throw new ApiError(403, 'You can only cancel your own bookings');
    }
    if (!['pending', 'confirmed'].includes(booking.status)) {
      throw new ApiError(400, 'Booking cannot be cancelled at this stage');
    }
    await BookingRepository.updateById(id, {
      status: 'cancelled',
      cancellationReason: reason || 'Cancelled by renter',
    });
    return BookingRepository.findByIdPopulated(id);
  }

  async updateDeliveryStatus(id: string, userId: string, input: { deliveryStatus: string; deliveryPartner?: string; estimatedArrival?: string | Date; deliveryOtp?: string; note?: string }) {
    const booking = await BookingRepository.findByIdPopulated(id);
    if (!booking) throw new ApiError(404, 'Booking not found');
    const isOwner = booking.owner._id.toString() === userId;
    const isRenter = booking.renter._id.toString() === userId;
    if (!isOwner && !isRenter) {
      throw new ApiError(403, 'You do not have access to this booking');
    }

    if (input.deliveryStatus === 'pickup_ready' || input.deliveryStatus === 'out_for_delivery' || input.deliveryStatus === 'return_pickup') {
      if (!isOwner) {
        throw new ApiError(403, 'Only the owner can update delivery progress');
      }
    }
    if (input.deliveryStatus === 'delivered' || input.deliveryStatus === 'returned') {
      if (!isRenter && input.deliveryStatus === 'delivered') {
        throw new ApiError(403, 'Only the renter can confirm delivery');
      }
    }

    const timelineItem = {
      status: input.deliveryStatus as any,
      note: input.note || `Delivery status updated to ${input.deliveryStatus}`,
      timestamp: new Date(),
    };

    const updatePayload: any = {
      deliveryStatus: input.deliveryStatus as any,
      deliveryPartner: input.deliveryPartner || booking.deliveryPartner,
      estimatedArrival: input.estimatedArrival ? new Date(input.estimatedArrival) : booking.estimatedArrival,
      deliveryOtp: input.deliveryOtp || booking.deliveryOtp,
      trackingTimeline: [...(booking.trackingTimeline || []), timelineItem],
    };

    await BookingRepository.updateById(id, updatePayload);
    return BookingRepository.findByIdPopulated(id);
  }

  async verifyDeliveryOtp(id: string, userId: string, deliveryOtp: string) {
    const booking = await BookingRepository.findByIdPopulated(id);
    if (!booking) throw new ApiError(404, 'Booking not found');
    if (booking.renter._id.toString() !== userId && booking.owner._id.toString() !== userId) {
      throw new ApiError(403, 'You do not have access to this booking');
    }
    if (!booking.deliveryOtp) {
      throw new ApiError(400, 'No OTP has been assigned for this booking');
    }
    if (booking.deliveryOtp !== deliveryOtp) {
      throw new ApiError(400, 'Invalid OTP');
    }
    await BookingRepository.updateById(id, { deliveryOtp: '' });
    return BookingRepository.findByIdPopulated(id);
  }

  async listOwnerBookings(ownerId: string, options: any) {
    return BookingRepository.listForOwner(ownerId, options);
  }
}

export default new BookingService();

