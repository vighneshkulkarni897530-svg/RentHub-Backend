// RecommendationService unit tests — repositories mocked

vi.mock('../../../../src/repositories/UserBehaviorRepository', () => ({
  default: {
    recentProductIds: vi.fn(),
    preferredCategoryIds: vi.fn(),
    similarUsers: vi.fn(),
  },
}));

vi.mock('../../../../src/repositories/WishlistRepository', () => ({
  default: {
    findByUser: vi.fn(),
  },
}));

vi.mock('../../../../src/repositories/BookingRepository', () => ({
  default: {
    find: vi.fn(),
  },
}));

vi.mock('../../../../src/repositories/ProductRepository', () => ({
  default: {
    find: vi.fn(),
    findByIdPopulated: vi.fn(),
    listProducts: vi.fn(),
  },
}));

import RecommendationService from '../../../../src/services/ai/recommendation.service';
import UserBehaviorRepository from '../../../../src/repositories/UserBehaviorRepository';
import WishlistRepository from '../../../../src/repositories/WishlistRepository';
import BookingRepository from '../../../../src/repositories/BookingRepository';
import ProductRepository from '../../../../src/repositories/ProductRepository';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('RecommendationService', () => {
  describe('getRecommendations', () => {
    it('returns popular products for cold start', async () => {
      (UserBehaviorRepository.recentProductIds as any).mockResolvedValue([]);
      (UserBehaviorRepository.preferredCategoryIds as any).mockResolvedValue([]);
      (WishlistRepository.findByUser as any).mockResolvedValue(null);
      (BookingRepository.find as any).mockResolvedValue([]);
      (UserBehaviorRepository.similarUsers as any).mockResolvedValue([]);
      (ProductRepository.find as any).mockResolvedValue([]);
      (ProductRepository.listProducts as any).mockResolvedValue({
        data: [{ _id: 'p1', title: 'Camera', rating: 4, bookingsCount: 5 }],
      });
      const result = await RecommendationService.getRecommendations('user1', { limit: 5 });
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].reason).toBe('popular');
    });

    it('scores candidates based on signals', async () => {
      (UserBehaviorRepository.recentProductIds as any).mockResolvedValue(['p1']);
      (UserBehaviorRepository.preferredCategoryIds as any).mockResolvedValue(['cat1']);
      (WishlistRepository.findByUser as any).mockResolvedValue({ products: [] });
      (BookingRepository.find as any).mockResolvedValue([]);
      (UserBehaviorRepository.similarUsers as any).mockResolvedValue([]);
      (ProductRepository.find as any).mockResolvedValue([
        { _id: 'p1', title: 'Camera', category: { _id: 'cat1' }, rating: 4, bookingsCount: 5, description: 'x', tags: [] },
      ]);
      const result = await RecommendationService.getRecommendations('user1', { limit: 5 });
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('similarProducts', () => {
    it('returns empty when product not found', async () => {
      (ProductRepository.findByIdPopulated as any).mockResolvedValue(null);
      const result = await RecommendationService.similarProducts('p1');
      expect(result).toEqual([]);
    });

    it('returns similar products', async () => {
      (ProductRepository.findByIdPopulated as any).mockResolvedValue({
        _id: 'p1',
        title: 'Canon Camera',
        description: 'Professional camera',
        tags: ['camera'],
        category: { _id: 'cat1' },
      });
      (ProductRepository.find as any).mockResolvedValue([
        { _id: 'p2', title: 'Canon DSLR', description: 'Professional DSLR camera', tags: ['camera'], category: 'cat1' },
      ]);
      const result = await RecommendationService.similarProducts('p1', 5);
      expect(result).toHaveLength(1);
    });
  });

  describe('popularProducts', () => {
    it('returns popular products', async () => {
      (ProductRepository.listProducts as any).mockResolvedValue({ data: [{ _id: 'p1' }] });
      const result = await RecommendationService.popularProducts(5);
      expect(result).toEqual([{ _id: 'p1' }]);
    });
  });

  describe('frequentlyRentedTogether', () => {
    it('returns empty for empty input', async () => {
      const result = await RecommendationService.frequentlyRentedTogether([], 5);
      expect(result).toEqual([]);
    });
  });
});
