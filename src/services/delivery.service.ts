import crypto from 'crypto';
import ApiError from '../utils/ApiError';
import BookingRepository from '../repositories/BookingRepository';
import DeliveryPartnerRepository from '../repositories/DeliveryPartnerRepository';
import notificationService from './notification.service';
import emailService from './email.service';
import smsService from './sms.service';

// ============================================================
// RentHub - Delivery Service
// ============================================================
// Delivery partners, pickup scheduling, delivery/return tracking,
// OTP verification, and live booking timeline.
// ============================================================

export class DeliveryService {
  /**
   * Create a delivery partner (admin).
   */
  async createPartner(input: { name: string; phone: string; email?: string; vehicle?: string; zones?: string[] }) {
    return DeliveryPartnerRepository.create({
      name: input.name,
      phone: input.phone,
      email: input.email || '',
      vehicle: input.vehicle || '',
      zones: input.zones || [],
      status: 'active',
      isVerified: true,
    });
  }

  async listPartners(role: string, options: any) {
    if (role === 'admin') return DeliveryPartnerRepository.listAll(options);
    return DeliveryPartnerRepository.listAvailable(options);
  }

  async updatePartner(id: string, input: Record<string, unknown>) {
    const partner = await DeliveryPartnerRepository.findById(id);
    if (!partner) throw new ApiError(404, 'Delivery partner not found');
    return DeliveryPartnerRepository.updateById(id, input);
  }

  /**
   * Assign a delivery partner to a booking (owner action).
   */
  async assignPartner(bookingId: string, ownerId: string, partnerId: string) {
    const booking = await BookingRepository.findByIdPopulated(bookingId);
    if (!booking) throw new ApiError(404, 'Booking not found');
    if (booking.owner._id.toString() !== ownerId) {
      throw new ApiError(403, 'Only the owner can assign a delivery partner');
    }

    const partner = await DeliveryPartnerRepository.findById(partnerId);
    if (!partner) throw new ApiError(404, 'Delivery partner not found');

    await BookingRepository.updateById(bookingId, {
      deliveryPartner: partnerId,
      deliveryStatus: 'pickup_ready',
      trackingTimeline: [
        ...(booking.trackingTimeline || []),
        {
          status: 'pickup_ready',
          note: `Delivery partner ${partner.name} assigned`,
          timestamp: new Date(),
        },
      ],
    });

    void notificationService.notifyDelivery({
      userId: booking.renter._id.toString(),
      title: 'Delivery partner assigned',
      message: `${partner.name} will deliver your item.`,
      link: `/dashboard/my-rentals`,
    });

    return BookingRepository.findByIdPopulated(bookingId);
  }

  /**
   * Schedule a pickup (owner sets a time window).
   */
  async schedulePickup(bookingId: string, ownerId: string, input: { pickupDate: string | Date; note?: string }) {
    const booking = await BookingRepository.findByIdPopulated(bookingId);
    if (!booking) throw new ApiError(404, 'Booking not found');
    if (booking.owner._id.toString() !== ownerId) {
      throw new ApiError(403, 'Only the owner can schedule pickup');
    }

    const pickupDate = new Date(input.pickupDate);

    await BookingRepository.updateById(bookingId, {
      estimatedArrival: pickupDate,
      deliveryStatus: 'pickup_ready',
      trackingTimeline: [
        ...(booking.trackingTimeline || []),
        {
          status: 'pickup_ready',
          note: input.note || `Pickup scheduled for ${pickupDate.toLocaleString()}`,
          timestamp: new Date(),
        },
      ],
    });

    void notificationService.notifyDelivery({
      userId: booking.renter._id.toString(),
      title: 'Pickup scheduled',
      message: `Your item pickup is scheduled for ${pickupDate.toLocaleString()}.`,
      link: '/dashboard/my-rentals',
    });

    return BookingRepository.findByIdPopulated(bookingId);
  }

  /**
   * Update delivery status (owner for outbound, renter for receipt).
   */
  async updateDeliveryStatus(bookingId: string, userId: string, input: { deliveryStatus: string; note?: string; deliveryOtp?: string; estimatedArrival?: string }) {
    const booking = await BookingRepository.findByIdPopulated(bookingId);
    if (!booking) throw new ApiError(404, 'Booking not found');
    const isOwner = booking.owner._id.toString() === userId;
    const isRenter = booking.renter._id.toString() === userId;

    if (!isOwner && !isRenter) throw new ApiError(403, 'No access to this booking');

    const status = input.deliveryStatus;
    const timelineItem = {
      status: status as any,
      note: input.note || `Delivery status updated to ${status}`,
      timestamp: new Date(),
    };

    const updatePayload: any = {
      deliveryStatus: status as any,
      trackingTimeline: [...(booking.trackingTimeline || []), timelineItem],
    };
    if (input.estimatedArrival) updatePayload.estimatedArrival = new Date(input.estimatedArrival);
    if (input.deliveryOtp) updatePayload.deliveryOtp = input.deliveryOtp;

    await BookingRepository.updateById(bookingId, updatePayload);

    // Notify the other party
    const notifyUserId = isOwner ? booking.renter._id.toString() : booking.owner._id.toString();
    void notificationService.notifyDelivery({
      userId: notifyUserId,
      title: 'Delivery update',
      message: `Delivery status: ${status}`,
      link: '/dashboard/my-rentals',
    });

const notifyUser = isOwner ? booking.renter : booking.owner;
    void emailService.sendDeliveryUpdateEmail((notifyUser as any).email, (notifyUser as any).name, {
      status,
      note: input.note,
      estimatedArrival: input.estimatedArrival,
    });

    return BookingRepository.findByIdPopulated(bookingId);
  }

  /**
   * Generate and send an OTP for delivery verification.
   */
  async generateOtp(bookingId: string, userId: string) {
    const booking = await BookingRepository.findByIdPopulated(bookingId);
    if (!booking) throw new ApiError(404, 'Booking not found');
    const isOwner = booking.owner._id.toString() === userId;
    const isRenter = booking.renter._id.toString() === userId;
    if (!isOwner && !isRenter) throw new ApiError(403, 'No access to this booking');

    const otp = crypto.randomInt(100000, 999999).toString();
    await BookingRepository.updateById(bookingId, { deliveryOtp: otp });

// Send OTP to renter via SMS + email
    void smsService.sendSms({
      to: (booking.renter as any).phone,
      message: `Your RentHub delivery OTP is ${otp}. Valid for 10 minutes.`,
    });
    void emailService.sendOtpEmail((booking.renter as any).email, (booking.renter as any).name, otp);

    // Notify both parties
    void notificationService.notifyDelivery({
      userId: booking.renter._id.toString(),
      title: 'Delivery OTP generated',
      message: 'An OTP has been generated for delivery verification.',
      link: '/dashboard/my-rentals',
    });

    return { otpSent: true, expiresIn: 600 };
  }

  /**
   * Verify a delivery OTP (renter confirmation).
   */
  async verifyOtp(bookingId: string, userId: string, otp: string) {
    const booking = await BookingRepository.findByIdPopulated(bookingId);
    if (!booking) throw new ApiError(404, 'Booking not found');
    if (booking.renter._id.toString() !== userId) {
      throw new ApiError(403, 'Only the renter can confirm delivery');
    }
    if (!booking.deliveryOtp || booking.deliveryOtp !== otp) {
      throw new ApiError(400, 'Invalid OTP');
    }

    await BookingRepository.updateById(bookingId, {
      deliveryOtp: '',
      deliveryStatus: 'delivered',
      trackingTimeline: [
        ...(booking.trackingTimeline || []),
        { status: 'delivered', note: 'Delivery confirmed by renter via OTP', timestamp: new Date() },
      ],
    });

    void notificationService.notifyDelivery({
      userId: booking.owner._id.toString(),
      title: 'Delivery confirmed',
      message: 'The renter has confirmed delivery via OTP.',
      link: '/owner/booking-requests',
    });

void emailService.sendDeliveryUpdateEmail((booking.owner as any).email, (booking.owner as any).name, {
      status: 'delivered',
      note: 'Delivery confirmed by renter via OTP.',
    });

    return BookingRepository.findByIdPopulated(bookingId);
  }

  /**
   * Initiate return pickup (owner).
   */
  async initiateReturn(bookingId: string, ownerId: string, note?: string) {
    const booking = await BookingRepository.findByIdPopulated(bookingId);
    if (!booking) throw new ApiError(404, 'Booking not found');
    if (booking.owner._id.toString() !== ownerId) {
      throw new ApiError(403, 'Only the owner can initiate return pickup');
    }
    if (booking.deliveryStatus !== 'delivered') {
      throw new ApiError(400, 'Item must be delivered before return pickup');
    }

    await BookingRepository.updateById(bookingId, {
      deliveryStatus: 'return_pickup',
      trackingTimeline: [
        ...(booking.trackingTimeline || []),
        { status: 'return_pickup', note: note || 'Return pickup initiated', timestamp: new Date() },
      ],
    });

    void notificationService.notifyDelivery({
      userId: booking.renter._id.toString(),
      title: 'Return pickup scheduled',
      message: 'Your item return pickup has been scheduled.',
      link: '/dashboard/my-rentals',
    });

    return BookingRepository.findByIdPopulated(bookingId);
  }

  /**
   * Confirm return (renter hands item back / owner receives).
   */
  async confirmReturn(bookingId: string, userId: string) {
    const booking = await BookingRepository.findByIdPopulated(bookingId);
    if (!booking) throw new ApiError(404, 'Booking not found');
    const isOwner = booking.owner._id.toString() === userId;
    const isRenter = booking.renter._id.toString() === userId;
    if (!isOwner && !isRenter) throw new ApiError(403, 'No access to this booking');
    if (booking.deliveryStatus !== 'return_pickup') {
      throw new ApiError(400, 'Return pickup must be initiated first');
    }

    await BookingRepository.updateById(bookingId, {
      deliveryStatus: 'returned',
      trackingTimeline: [
        ...(booking.trackingTimeline || []),
        { status: 'returned', note: 'Item returned successfully', timestamp: new Date() },
      ],
    });

    const notifyUserId = isOwner ? booking.renter._id.toString() : booking.owner._id.toString();
    void notificationService.notifyDelivery({
      userId: notifyUserId,
      title: 'Item returned',
      message: 'The item has been returned successfully.',
      link: '/dashboard/my-rentals',
    });

    return BookingRepository.findByIdPopulated(bookingId);
  }

  /**
   * Get the live booking timeline.
   */
  async getTimeline(bookingId: string, userId: string) {
    const booking = await BookingRepository.findByIdPopulated(bookingId);
    if (!booking) throw new ApiError(404, 'Booking not found');
    const isOwner = booking.owner._id.toString() === userId;
    const isRenter = booking.renter._id.toString() === userId;
    if (!isOwner && !isRenter) throw new ApiError(403, 'No access to this booking');
    return {
      deliveryStatus: booking.deliveryStatus,
      deliveryPartner: booking.deliveryPartner,
      estimatedArrival: booking.estimatedArrival,
      trackingTimeline: booking.trackingTimeline || [],
    };
  }
}

export default new DeliveryService();
