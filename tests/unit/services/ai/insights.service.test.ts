// InsightsService unit tests — repositories mocked

vi.mock('../../../../src/repositories/AIInsightRepository', () => ({
  default: {
    getCached: vi.fn(),
    cache: vi.fn(),
  },
}));

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

vi.mock('../../../../src/repositories/UserRepository', () => ({
  default: {
    find: vi.fn(),
  },
}));

vi.mock('../../../../src/repositories/PaymentRepository', () => ({
  default: {
    find: vi.fn(),
  },
}));

vi.mock('../../../../src/repositories/FraudAlertRepository', () => ({
  default: {
    countDocuments: vi.fn(),
  },
}));

vi.mock('../../../../src/utils/ai/image', () => ({
  clamp01: (n: number) => Math.max(0, Math.min(1, n)),
}));

import InsightsService from '../../../../src/services/ai/insights.service';
import AIInsightRepository from '../../../../src/repositories/AIInsightRepository';
import BookingRepository from '../../../../src/repositories/BookingRepository';
import ProductRepository from '../../../../src/repositories/ProductRepository';
import UserRepository from '../../../../src/repositories/UserRepository';
import PaymentRepository from '../../../../src/repositories/PaymentRepository';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('InsightsService', () => {
  describe('ownerInsights', () => {
    it('returns cached data when available', async () => {
      (AIInsightRepository.getCached as any).mockResolvedValue({ data: { totalProducts: 5 } });
      const result = await InsightsService.ownerInsights('owner1');
      expect(result.totalProducts).toBe(5);
    });

    it('computes insights and caches', async () => {
      (AIInsightRepository.getCached as any).mockResolvedValue(null);
      (ProductRepository.find as any).mockResolvedValue([
        { _id: 'p1', category: { _id: 'cat1', name: 'Camera' }, location: { city: 'Mumbai' } },
      ]);
      (BookingRepository.find as any).mockResolvedValue([
        { _id: 'b1', status: 'completed', createdAt: new Date(), startDate: new Date(), grandTotal: 500, product: { _id: 'p1', category: { _id: 'cat1', name: 'Camera' }, location: { city: 'Mumbai' } } },
      ]);
      (AIInsightRepository.cache as any).mockResolvedValue({});
      const result = await InsightsService.ownerInsights('owner1');
      expect(result.totalProducts).toBe(1);
      expect(result.totalBookings).toBe(1);
      expect(result.revenueForecast).toBeDefined();
      expect(result.bookingPrediction).toBeDefined();
      expect(result.demandTrend).toBeDefined();
      expect(result.peakSeason).toBeDefined();
      expect(result.inventoryUtilization).toBeDefined();
      expect(result.bestCategories).toBeDefined();
    });
  });

  describe('adminDashboard', () => {
    it('returns cached data when available', async () => {
      (AIInsightRepository.getCached as any).mockResolvedValue({ data: { userBehavior: {} } });
      const result = await InsightsService.adminDashboard();
      expect(result).toBeDefined();
    });

    it('computes admin dashboard data', async () => {
      (AIInsightRepository.getCached as any).mockResolvedValue(null);
      (BookingRepository.find as any).mockResolvedValue([]);
      (ProductRepository.find as any).mockResolvedValue([]);
      (UserRepository.find as any).mockResolvedValue([]);
      (PaymentRepository.find as any).mockResolvedValue([]);
      (AIInsightRepository.cache as any).mockResolvedValue({});
      const result = await InsightsService.adminDashboard();
      expect(result.revenuePrediction).toBeDefined();
      expect(result.growthForecast).toBeDefined();
      expect(result.popularCategories).toBeDefined();
      expect(result.userBehavior).toBeDefined();
      expect(result.fraudAlerts).toBeDefined();
    });
  });
});
