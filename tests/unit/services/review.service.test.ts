// ReviewService unit tests — repositories mocked via vi.mock

vi.mock('../../../src/repositories/ReviewRepository', () => ({
  default: {
    create: vi.fn(),
    findByProduct: vi.fn(),
    findByUser: vi.fn(),
    findById: vi.fn(),
    updateById: vi.fn(),
    findByOwnerProducts: vi.fn(),
  },
}));

vi.mock('../../../src/repositories/ProductRepository', () => ({
  default: {
    findById: vi.fn(),
    updateRating: vi.fn(),
  },
}));

vi.mock('../../../src/repositories/BookingRepository', () => ({
  default: {
    findById: vi.fn(),
    find: vi.fn(),
  },
}));

vi.mock('../../../src/services/notification.service', () => ({
  default: {
    createNotification: vi.fn().mockResolvedValue(undefined),
    notifyBookingCreated: vi.fn().mockResolvedValue(undefined),
    notifyPaymentReceived: vi.fn().mockResolvedValue(undefined),
  },
}));

import ReviewService from '../../../src/services/review.service';
import ReviewRepository from '../../../src/repositories/ReviewRepository';
import ProductRepository from '../../../src/repositories/ProductRepository';
import BookingRepository from '../../../src/repositories/BookingRepository';

const mockProduct = { _id: 'prod1', title: 'Camera', owner: 'owner1' };
const mockReview = { _id: 'rev1', product: 'prod1', user: 'user1', rating: 5, comment: 'Great' };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ReviewService', () => {
  describe('createReview', () => {
    it('creates a verified review with valid booking', async () => {
      (ProductRepository.findById as any).mockResolvedValue(mockProduct);
      (BookingRepository.findById as any).mockResolvedValue({
        product: 'prod1',
        renter: 'user1',
        status: 'completed',
      });
      (ReviewRepository.create as any).mockResolvedValue(mockReview);
      (ProductRepository.updateRating as any).mockResolvedValue({});

      const result = await ReviewService.createReview('user1', 'prod1', {
        rating: 5,
        comment: 'Great',
        booking: 'book1',
      });
      expect(result).toBeDefined();
      expect(ReviewRepository.create).toHaveBeenCalled();
      expect(ProductRepository.updateRating).toHaveBeenCalledWith('prod1');
    });

    it('throws 404 when product not found', async () => {
      (ProductRepository.findById as any).mockResolvedValue(null);
      await expect(
        ReviewService.createReview('user1', 'prod1', { rating: 5, comment: 'x' })
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('throws 400 when reviewing own product', async () => {
      (ProductRepository.findById as any).mockResolvedValue({ ...mockProduct, owner: 'user1' });
      await expect(
        ReviewService.createReview('user1', 'prod1', { rating: 5, comment: 'x' })
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('getProductReviews', () => {
    it('returns product reviews', async () => {
      (ReviewRepository.findByProduct as any).mockResolvedValue([mockReview]);
      const result = await ReviewService.getProductReviews('prod1', {});
      expect(result).toEqual([mockReview]);
    });
  });

  describe('getMyReviews', () => {
    it('returns user reviews', async () => {
      (ReviewRepository.findByUser as any).mockResolvedValue([mockReview]);
      const result = await ReviewService.getMyReviews('user1');
      expect(result).toEqual([mockReview]);
    });
  });

  describe('respondToReview', () => {
    it('owner responds to review on own product', async () => {
      (ReviewRepository.findById as any).mockResolvedValue({ ...mockReview, product: 'prod1' });
      (ProductRepository.findById as any).mockResolvedValue(mockProduct);
      (ReviewRepository.updateById as any).mockResolvedValue(mockReview);
      const result = await ReviewService.respondToReview('rev1', 'owner1', 'Thanks!');
      expect(ReviewRepository.updateById).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('throws 404 when review not found', async () => {
      (ReviewRepository.findById as any).mockResolvedValue(null);
      await expect(ReviewService.respondToReview('rev1', 'owner1', 'Thanks')).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('throws 403 when not owner of product', async () => {
      (ReviewRepository.findById as any).mockResolvedValue(mockReview);
      (ProductRepository.findById as any).mockResolvedValue({ ...mockProduct, owner: 'other' });
      await expect(ReviewService.respondToReview('rev1', 'owner1', 'Thanks')).rejects.toMatchObject({
        statusCode: 403,
      });
    });
  });
});
