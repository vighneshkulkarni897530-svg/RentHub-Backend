// PricingService unit tests — repositories mocked

vi.mock('../../../../src/repositories/ProductRepository', () => ({
  default: {
    find: vi.fn(),
  },
}));

vi.mock('../../../../src/repositories/BookingRepository', () => ({
  default: {
    find: vi.fn(),
  },
}));

vi.mock('../../../../src/repositories/AIInsightRepository', () => ({
  default: {
    getCached: vi.fn(),
    cache: vi.fn(),
  },
}));

vi.mock('../../../../src/utils/ai/image', () => ({
  clamp01: (n: number) => Math.max(0, Math.min(1, n)),
}));

import PricingService from '../../../../src/services/ai/pricing.service';
import ProductRepository from '../../../../src/repositories/ProductRepository';
import AIInsightRepository from '../../../../src/repositories/AIInsightRepository';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PricingService', () => {
  describe('suggestPrice', () => {
    it('returns price suggestion with no competitors', async () => {
      (AIInsightRepository.getCached as any).mockResolvedValue(null);
      (ProductRepository.find as any).mockResolvedValue([]);
      const result = await PricingService.suggestPrice({ category: 'cat1', condition: 'good' });
      expect(result.suggestedPrice).toBeGreaterThan(0);
      expect(result.competitorCount).toBe(0);
      expect(result.priceUnit).toBe('day');
    });

    it('computes average competitor price', async () => {
      (AIInsightRepository.getCached as any).mockResolvedValue(null);
      (ProductRepository.find as any).mockResolvedValue([
        { rentalPrice: 100, bookingsCount: 5, rating: 4 },
        { rentalPrice: 200, bookingsCount: 10, rating: 5 },
      ]);
      const result = await PricingService.suggestPrice({ category: 'cat1', condition: 'new' });
      expect(result.competitorCount).toBe(2);
      expect(result.avgCompetitorPrice).toBe(150);
    });

it('returns cached result when available', async () => {
      (AIInsightRepository.getCached as any).mockResolvedValue({
        data: { key: 'price:cat1::good::day', suggestedPrice: 99 },
      });
      const result = await PricingService.suggestPrice({ category: 'cat1', condition: 'good' });
      expect(result.suggestedPrice).toBe(99);
    });

    it('applies premium brand factor', async () => {
      (AIInsightRepository.getCached as any).mockResolvedValue(null);
      (ProductRepository.find as any).mockResolvedValue([]);
      const result = await PricingService.suggestPrice({ category: 'cat1', brand: 'canon', condition: 'good' });
      expect(result.brandFactor).toBeGreaterThan(1);
    });
  });
});
