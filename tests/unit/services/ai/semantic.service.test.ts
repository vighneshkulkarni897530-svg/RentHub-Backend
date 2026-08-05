// SemanticSearchService unit tests — repositories mocked

vi.mock('../../../../src/repositories/ProductRepository', () => ({
  default: {
    listProducts: vi.fn(),
    find: vi.fn(),
  },
}));

vi.mock('../../../../src/repositories/CategoryRepository', () => ({
  default: {
    findOne: vi.fn(),
    find: vi.fn(),
  },
}));

import SemanticSearchService from '../../../../src/services/ai/semantic.service';
import ProductRepository from '../../../../src/repositories/ProductRepository';
import CategoryRepository from '../../../../src/repositories/CategoryRepository';

const mockProducts = [
  { _id: 'p1', title: 'Canon DSLR Camera', description: 'Professional camera for rent', tags: ['camera', 'canon'], features: [] },
  { _id: 'p2', title: 'Sony Mirrorless Camera', description: 'Compact mirrorless camera', tags: ['camera', 'sony'], features: [] },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe('SemanticSearchService', () => {
  describe('semanticSearch', () => {
    it('returns products with relevance scores', async () => {
      (CategoryRepository.findOne as any).mockResolvedValue(null);
      (ProductRepository.listProducts as any).mockResolvedValue({ data: mockProducts });
      const result = await SemanticSearchService.semanticSearch('camera', { limit: 10 });
      expect(result.total).toBeGreaterThan(0);
      expect(result.semantic.query).toBe('camera');
      expect(result.semantic.tokens).toBeDefined();
    });

    it('returns empty for empty query', async () => {
      (CategoryRepository.findOne as any).mockResolvedValue(null);
      (ProductRepository.listProducts as any).mockResolvedValue({ data: [] });
      const result = await SemanticSearchService.semanticSearch('', { limit: 10 });
      expect(result.data).toEqual([]);
    });

    it('detects category and applies filter', async () => {
      (CategoryRepository.findOne as any).mockResolvedValue({ _id: 'cat1', slug: 'camera' });
      (ProductRepository.listProducts as any).mockResolvedValue({ data: mockProducts });
      const result = await SemanticSearchService.semanticSearch('camera', { limit: 10 });
      expect(result.semantic.detectedCategory).not.toBeNull();
      expect(ProductRepository.listProducts).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'cat1' }),
        expect.anything()
      );
    });
  });
});
