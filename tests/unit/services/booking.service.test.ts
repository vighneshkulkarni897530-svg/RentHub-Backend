// BookingService unit tests — repositories mocked via vi.mock
// NOTE: uses globals (describe/it/expect/vi) — do NOT import from 'vitest'

vi.mock('../../../src/repositories/BookingRepository', () => ({
  default: {
    create: vi.fn(),
    findByIdPopulated: vi.fn(),
    findById: vi.fn(),
    findOverlapping: vi.fn(),
    listForUser: vi.fn(),
    listForOwner: vi.fn(),
    listAll: vi.fn(),
    updateById: vi.fn(),
    find: vi.fn(),
    countDocuments: vi.fn(),
  },
}));

vi.mock('../../../src/repositories/ProductRepository', () => ({
  default: {
    findById: vi.fn(),
    incrementStat: vi.fn(),
  },
}));

vi.mock('../../../src/repositories/ProductAvailabilityRepository', () => ({
  default: {
    findConflicts: vi.fn(),
  },
}));

vi.mock('../../../src/services/notification.service', () => ({
  default: {
    notifyBookingCreated: vi.fn().mockResolvedValue(undefined),
    createNotification: vi.fn().mockResolvedValue(undefined),
    notifyPaymentReceived: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../../src/services/coupon.service', () => ({
  default: {
    applyCoupon: vi.fn(),
    redeemCoupon: vi.fn().mockResolvedValue(undefined),
  },
}));

import BookingService from '../../../src/services/booking.service';
import BookingRepository from '../../../src/repositories/BookingRepository';
import ProductRepository from '../../../src/repositories/ProductRepository';
import ProductAvailabilityRepository from '../../../src/repositories/ProductAvailabilityRepository';
import couponService from '../../../src/services/coupon.service';

const mockProduct = {
  _id: 'prod1',
  title: 'Canon Camera',
  owner: 'owner1',
  listingStatus: 'active',
  securityDeposit: 1000,
};

const mockBooking = {
  _id: 'book1',
  id: 'book1',
  product: { _id: 'prod1' },
  renter: { _id: 'renter1' },
  owner: { _id: 'owner1' },
  status: 'pending',
  paymentStatus: 'pending',
  totalPrice: 500,
  platformFee: 50,
  grandTotal: 550,
  deliveryFee: 0,
  securityDeposit: 1000,
  startDate: new Date(),
  endDate: new Date(Date.now() + 86400000),
  trackingTimeline: [],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('BookingService', () => {
  describe('createBooking', () => {
    it('creates a booking', async () => {
      (ProductRepository.findById as any).mockResolvedValue(mockProduct);
      (BookingRepository.findOverlapping as any).mockResolvedValue([]);
      (ProductAvailabilityRepository.findConflicts as any).mockResolvedValue([]);
      (BookingRepository.create as any).mockResolvedValue(mockBooking);
      (BookingRepository.findByIdPopulated as any).mockResolvedValue(mockBooking);

      const result = await BookingService.createBooking('renter1', {
        product: 'prod1',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
        duration: 1,
        durationUnit: 'day',
        totalPrice: 500,
      });
      expect(result).toBeDefined();
      expect(BookingRepository.create).toHaveBeenCalled();
    });

    it('throws 404 when product not found', async () => {
      (ProductRepository.findById as any).mockResolvedValue(null);
      await expect(
        BookingService.createBooking('renter1', {
          product: 'prod1',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 86400000).toISOString(),
          duration: 1,
          durationUnit: 'day',
          totalPrice: 500,
        })
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('throws 400 when product inactive', async () => {
      (ProductRepository.findById as any).mockResolvedValue({ ...mockProduct, listingStatus: 'inactive' });
      await expect(
        BookingService.createBooking('renter1', {
          product: 'prod1',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 86400000).toISOString(),
          duration: 1,
          durationUnit: 'day',
          totalPrice: 500,
        })
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('throws 400 when booking own product', async () => {
      (ProductRepository.findById as any).mockResolvedValue({ ...mockProduct, owner: 'renter1' });
      await expect(
        BookingService.createBooking('renter1', {
          product: 'prod1',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 86400000).toISOString(),
          duration: 1,
          durationUnit: 'day',
          totalPrice: 500,
        })
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('throws 400 when end date before start date', async () => {
      (ProductRepository.findById as any).mockResolvedValue(mockProduct);
      await expect(
        BookingService.createBooking('renter1', {
          product: 'prod1',
          startDate: new Date(Date.now() + 86400000).toISOString(),
          endDate: new Date().toISOString(),
          duration: 1,
          durationUnit: 'day',
          totalPrice: 500,
        })
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('throws 409 when overlapping booking', async () => {
      (ProductRepository.findById as any).mockResolvedValue(mockProduct);
      (BookingRepository.findOverlapping as any).mockResolvedValue([{ id: 'overlap' }]);
      await expect(
        BookingService.createBooking('renter1', {
          product: 'prod1',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 86400000).toISOString(),
          duration: 1,
          durationUnit: 'day',
          totalPrice: 500,
        })
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    it('throws 409 when blocked dates', async () => {
      (ProductRepository.findById as any).mockResolvedValue(mockProduct);
      (BookingRepository.findOverlapping as any).mockResolvedValue([]);
      (ProductAvailabilityRepository.findConflicts as any).mockResolvedValue([{ id: 'block' }]);
      await expect(
        BookingService.createBooking('renter1', {
          product: 'prod1',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 86400000).toISOString(),
          duration: 1,
          durationUnit: 'day',
          totalPrice: 500,
        })
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    it('applies coupon when provided', async () => {
      (ProductRepository.findById as any).mockResolvedValue(mockProduct);
      (BookingRepository.findOverlapping as any).mockResolvedValue([]);
      (ProductAvailabilityRepository.findConflicts as any).mockResolvedValue([]);
      (couponService.applyCoupon as any).mockResolvedValue({
        couponCode: 'SAVE10',
        couponDiscount: 50,
        couponType: 'fixed',
      });
      (couponService.redeemCoupon as any).mockResolvedValue({});
      (BookingRepository.create as any).mockResolvedValue(mockBooking);
      (BookingRepository.findByIdPopulated as any).mockResolvedValue(mockBooking);

      await BookingService.createBooking('renter1', {
        product: 'prod1',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
        duration: 1,
        durationUnit: 'day',
        totalPrice: 500,
        couponCode: 'SAVE10',
      });
      expect(couponService.applyCoupon).toHaveBeenCalled();
      expect(couponService.redeemCoupon).toHaveBeenCalled();
    });
  });

  describe('getBookingById', () => {
    it('returns booking for participant', async () => {
      (BookingRepository.findByIdPopulated as any).mockResolvedValue(mockBooking);
      const result = await BookingService.getBookingById('book1', 'renter1');
      expect(result).toBeDefined();
    });

    it('throws 404 when not found', async () => {
      (BookingRepository.findByIdPopulated as any).mockResolvedValue(null);
      await expect(BookingService.getBookingById('missing')).rejects.toMatchObject({ statusCode: 404 });
    });

    it('throws 403 for non-participant', async () => {
      (BookingRepository.findByIdPopulated as any).mockResolvedValue(mockBooking);
      await expect(BookingService.getBookingById('book1', 'stranger')).rejects.toMatchObject({ statusCode: 403 });
    });
  });

  describe('updateBookingStatus', () => {
    it('owner confirms pending booking', async () => {
      (BookingRepository.findByIdPopulated as any).mockResolvedValue({ ...mockBooking, status: 'pending' });
      (BookingRepository.updateById as any).mockResolvedValue(mockBooking);
      (BookingRepository.findByIdPopulated as any).mockResolvedValue(mockBooking);
      const result = await BookingService.updateBookingStatus('book1', 'owner1', 'confirmed');
      expect(result).toBeDefined();
    });

    it('owner declines pending booking', async () => {
      (BookingRepository.findByIdPopulated as any).mockResolvedValue({ ...mockBooking, status: 'pending' });
      (BookingRepository.updateById as any).mockResolvedValue(mockBooking);
      (BookingRepository.findByIdPopulated as any).mockResolvedValue(mockBooking);
      const result = await BookingService.updateBookingStatus('book1', 'owner1', 'declined');
      expect(result).toBeDefined();
    });

    it('renter cancels pending booking', async () => {
      (BookingRepository.findByIdPopulated as any).mockResolvedValue({ ...mockBooking, status: 'pending' });
      (BookingRepository.updateById as any).mockResolvedValue(mockBooking);
      (BookingRepository.findByIdPopulated as any).mockResolvedValue(mockBooking);
      const result = await BookingService.updateBookingStatus('book1', 'renter1', 'cancelled');
      expect(result).toBeDefined();
    });

    it('throws 404 when booking not found', async () => {
      (BookingRepository.findByIdPopulated as any).mockResolvedValue(null);
      await expect(BookingService.updateBookingStatus('missing', 'owner1', 'confirmed')).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('throws 400 for invalid transition', async () => {
      (BookingRepository.findByIdPopulated as any).mockResolvedValue({ ...mockBooking, status: 'pending' });
      await expect(BookingService.updateBookingStatus('book1', 'renter1', 'confirmed')).rejects.toMatchObject({
        statusCode: 400,
      });
    });
  });

  describe('cancelBooking', () => {
    it('renter cancels own booking', async () => {
      (BookingRepository.findByIdPopulated as any).mockResolvedValue({ ...mockBooking, status: 'confirmed' });
      (BookingRepository.updateById as any).mockResolvedValue(mockBooking);
      (BookingRepository.findByIdPopulated as any).mockResolvedValue(mockBooking);
      const result = await BookingService.cancelBooking('book1', 'renter1');
      expect(result).toBeDefined();
    });

    it('throws 403 when not renter', async () => {
      (BookingRepository.findByIdPopulated as any).mockResolvedValue(mockBooking);
      await expect(BookingService.cancelBooking('book1', 'stranger')).rejects.toMatchObject({ statusCode: 403 });
    });

    it('throws 400 when cannot cancel at stage', async () => {
      (BookingRepository.findByIdPopulated as any).mockResolvedValue({ ...mockBooking, status: 'completed' });
      await expect(BookingService.cancelBooking('book1', 'renter1')).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('listMyBookings', () => {
    it('lists bookings for user', async () => {
      (BookingRepository.listForUser as any).mockResolvedValue({ data: [], total: 0 });
      const result = await BookingService.listMyBookings('renter1', {});
      expect(result).toBeDefined();
    });
  });

  describe('listOwnerBookings', () => {
    it('lists bookings for owner', async () => {
      (BookingRepository.listForOwner as any).mockResolvedValue({ data: [], total: 0 });
      const result = await BookingService.listOwnerBookings('owner1', {});
      expect(result).toBeDefined();
    });
  });
});
