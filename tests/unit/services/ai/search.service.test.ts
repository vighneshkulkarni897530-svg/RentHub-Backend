// SmartSearchService unit tests — repositories mocked

vi.mock('../../../../src/repositories/SearchAnalyticsRepository', () => ({
  default: {
    querySuggestions: vi.fn(),
    trendingQueries: vi.fn(),
    popularQueries: vi.fn(),
    recentQueries: vi.fn(),
    recordSearch: vi.fn(),
    recordClick: vi.fn(),
  },
}));

vi.mock('../../../../src/repositories/ProductRepository', () => ({
  default: {
    find: vi.fn(),
  },
}));

vi.mock('../../../../src/repositories/CategoryRepository', () => ({
  default: {
    find: vi.fn(),
  },
}));

import SmartSearchService from '../../../../src/services/ai/search.service';
import SearchAnalyticsRepository from '../../../../src/repositories/SearchAnalyticsRepository';
import ProductRepository from '../../../../src/repositories/ProductRepository';
import CategoryRepository from '../../../../src/repositories/CategoryRepository';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('SmartSearchService', () => {
  describe('autocomplete', () => {
    it('returns empty for blank term', async () => {
      const result = await SmartSearchService.autocomplete('   ');
      expect(result.suggestions).toEqual([]);
    });

    it('returns deduplicated suggestions', async () => {
      (SearchAnalyticsRepository.querySuggestions as any).mockResolvedValue(['camera', 'canon']);
      (ProductRepository.find as any).mockResolvedValue([{ title: 'camera' }]);
      (CategoryRepository.find as any).mockResolvedValue([{ name: 'canon' }]);
      const result = await SmartSearchService.autocomplete('cam', 5);
      expect(result.suggestions).toContain('camera');
      expect(result.suggestions).toContain('canon');
    });
  });

  describe('correctTypo', () => {
    it('returns empty for blank term', async () => {
      const result = await SmartSearchService.correctTypo('   ');
      expect(result.corrected).toBeNull();
    });

    it('returns corrected term', async () => {
      (SearchAnalyticsRepository.trendingQueries as any).mockResolvedValue([{ query: 'camera' }]);
      (ProductRepository.find as any).mockResolvedValue([]);
      (CategoryRepository.find as any).mockResolvedValue([]);
const result = await SmartSearchService.correctTypo('camra', 5);
      expect(result.corrected).toBe('camera');
    });
  });

  describe('trending', () => {
    it('returns trending queries', async () => {
      (SearchAnalyticsRepository.trendingQueries as any).mockResolvedValue([{ query: 'camera', count: 10 }]);
      const result = await SmartSearchService.trending(5);
      expect(result).toEqual([{ query: 'camera', count: 10 }]);
    });
  });

  describe('popular', () => {
    it('returns popular queries', async () => {
      (SearchAnalyticsRepository.popularQueries as any).mockResolvedValue([{ query: 'camera' }]);
      const result = await SmartSearchService.popular(5);
      expect(result).toEqual([{ query: 'camera' }]);
    });
  });

  describe('recent', () => {
    it('returns recent queries', async () => {
      (SearchAnalyticsRepository.recentQueries as any).mockResolvedValue([{ query: 'camera' }]);
      const result = await SmartSearchService.recent('user1', 5);
      expect(result).toEqual([{ query: 'camera' }]);
    });
  });

  describe('recordSearch', () => {
    it('records a search event', async () => {
      (SearchAnalyticsRepository.recordSearch as any).mockResolvedValue({ _id: 's1' });
      const result = await SmartSearchService.recordSearch({ query: 'camera', userId: 'u1' });
      expect(result).toEqual({ _id: 's1' });
    });

    it('returns null for blank query', async () => {
      const result = await SmartSearchService.recordSearch({ query: '   ' });
      expect(result).toBeNull();
    });
  });

  describe('recordClick', () => {
    it('records a click event', async () => {
      (SearchAnalyticsRepository.recordClick as any).mockResolvedValue({ _id: 's1' });
      const result = await SmartSearchService.recordClick({ query: 'camera', productId: 'p1' });
      expect(result).toEqual({ _id: 's1' });
    });
  });
});
