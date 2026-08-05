// OwnerService unit tests — repositories mocked via vi.mock

vi.mock('../../../src/repositories/ProductRepository', () => ({
  default: {
    find: vi.fn(),
  },
}));

vi.mock('../../../src/repositories/BookingRepository', () => ({
  default: {
    find: vi.fn(),
    listForOwner: vi.fn(),
  },
}));

vi.mock('../../../src/repositories/ReviewRepository', () => ({
  default: {
    find: vi.fn(),
    findByOwnerProducts: vi.fn(),
  },
}));

vi.mock('../../../src/repositories/PaymentRepository', () => ({
  default: {
    find: vi.fn(),
  },
}));

vi.mock('../../../src/services/kyc.service', () => ({
  default: {
    submitVerification: vi.fn(),
    getVerificationStatus: vi.fn(),
    reviewVerification: vi.fn(),
  },
}));

vi.mock('../../../src/repositories/UserRepository', () => ({
  default: {
    updateById: vi.fn(),
  },
}));

import OwnerService from '../../../src/services/owner.service';
import ProductRepository from '../../../src/repositories/ProductRepository';
import BookingRepository from '../../../src/repositories/BookingRepository';
import ReviewRepository from '../../../src/repositories/ReviewRepository';
import PaymentRepository from '../../../src/repositories/PaymentRepository';
import KycService from '../../../src/services/kyc.service';
import UserRepository from '../../../src/repositories/UserRepository';

const mockProduct = { _id: 'prod1', listingStatus: 'active', category: 'cat1' };
const mockBooking = { _id: 'book1', status: 'completed', grandTotal: 500, product: { _id: 'prod1' } };
const mockReview = { _id: 'rev1', rating: 5, product: 'prod1' };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('OwnerService', () => {
  describe('getOwnerStats', () => {
    it('returns owner stats', async () => {
      (ProductRepository.find as any).mockResolvedValue([mockProduct]);
      (BookingRepository.find as any).mockResolvedValue([mockBooking]);
      (ReviewRepository.find as any).mockResolvedValue([mockReview]);
      const result = await OwnerService.getOwnerStats('owner1');
      expect(result.totalListings).toBe(1);
      expect(result.activeListings).toBe(1);
      expect(result.totalBookings).toBe(1);
      expect(result.totalEarnings).toBe(500);
      expect(result.averageRating).toBe(5);
    });
  });

  describe('getOwnerListings', () => {
    it('returns owner listings', async () => {
      (ProductRepository.find as any).mockResolvedValue([mockProduct]);
      const result = await OwnerService.getOwnerListings('owner1');
      expect(result).toEqual([mockProduct]);
    });
  });

  describe('getOwnerBookings', () => {
    it('returns owner bookings', async () => {
      (BookingRepository.listForOwner as any).mockResolvedValue([mockBooking]);
      const result = await OwnerService.getOwnerBookings('owner1', {});
      expect(result).toEqual([mockBooking]);
    });
  });

  describe('getOwnerReviews', () => {
    it('returns owner product reviews', async () => {
      (ReviewRepository.findByOwnerProducts as any).mockResolvedValue([mockReview]);
      const result = await OwnerService.getOwnerReviews('owner1');
      expect(result).toEqual([mockReview]);
    });
  });

  describe('getOwnerEarnings', () => {
    it('returns total earnings', async () => {
      (PaymentRepository.find as any).mockResolvedValue([
        { netAmount: 500, amount: 600 },
        { netAmount: 300, amount: 400 },
      ]);
      const result = await OwnerService.getOwnerEarnings('owner1');
      expect(result.total).toBe(800);
      expect(result.count).toBe(2);
    });
  });

  describe('submitVerification', () => {
    it('submits owner verification', async () => {
      (KycService.submitVerification as any).mockResolvedValue({ id: 'kyc1' });
      (UserRepository.updateById as any).mockResolvedValue({});
      const result = await OwnerService.submitVerification('owner1', {
        storeName: 'Store',
        storeDescription: 'Desc',
        documentType: 'govt_id' as any,
        documentUrls: ['url'],
      });
      expect(result).toEqual({ id: 'kyc1' });
      expect(UserRepository.updateById).toHaveBeenCalled();
    });
  });

  describe('getVerificationStatus', () => {
    it('returns verification status', async () => {
      (KycService.getVerificationStatus as any).mockResolvedValue({ id: 'kyc1' });
      const result = await OwnerService.getVerificationStatus('owner1');
      expect(result).toEqual({ id: 'kyc1' });
    });
  });

  describe('reviewVerification', () => {
    it('reviews verification', async () => {
      (KycService.reviewVerification as any).mockResolvedValue({ id: 'kyc1' });
      const result = await OwnerService.reviewVerification('kyc1', 'admin1', 'verified');
      expect(result).toEqual({ id: 'kyc1' });
    });
  });
});
