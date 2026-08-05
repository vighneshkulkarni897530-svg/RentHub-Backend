// ProductService unit tests — repositories mocked via vi.mock
// NOTE: uses globals (describe/it/expect/vi) — do NOT import from 'vitest'

vi.mock('../../../src/repositories/ProductRepository', () => ({
  default: {
    findOne: vi.fn(),
    create: vi.fn(),
    findById: vi.fn(),
    findByIdPopulated: vi.fn(),
    updateById: vi.fn(),
    deleteById: vi.fn(),
    find: vi.fn(),
    listProducts: vi.fn(),
    findBySlug: vi.fn(),
  },
}));

vi.mock('../../../src/repositories/CategoryRepository', () => ({
  default: {
    findById: vi.fn(),
    findOne: vi.fn(),
    find: vi.fn(),
  },
}));

vi.mock('../../../src/repositories/ProductImageRepository', () => ({
  default: {
    create: vi.fn(),
    deleteForProduct: vi.fn(),
  },
}));

vi.mock('../../../src/repositories/ProductAvailabilityRepository', () => ({
  default: {
    create: vi.fn(),
    findConflicts: vi.fn(),
    findByProduct: vi.fn(),
    findById: vi.fn(),
    deleteById: vi.fn(),
  },
}));

import ProductService from '../../../src/services/product.service';
import ProductRepository from '../../../src/repositories/ProductRepository';
import CategoryRepository from '../../../src/repositories/CategoryRepository';
import ProductImageRepository from '../../../src/repositories/ProductImageRepository';
import ProductAvailabilityRepository from '../../../src/repositories/ProductAvailabilityRepository';

const mockCategory = { _id: 'cat1', name: 'Cameras' };
const mockProduct = {
  _id: 'prod1',
  id: 'prod1',
  title: 'Canon 5D Camera',
  slug: 'canon-5d-camera',
  description: 'A professional camera for rent',
  category: 'cat1',
  owner: 'owner1',
  images: [],
  rentalPrice: 500,
  priceUnit: 'day',
  securityDeposit: 1000,
  listingStatus: 'active',
  moderationStatus: 'approved',
  location: { city: 'Mumbai' },
  created: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ProductService', () => {
  describe('createProduct', () => {
    it('creates a product with images', async () => {
      (CategoryRepository.findById as any).mockResolvedValue(mockCategory);
      (ProductRepository.findOne as any).mockResolvedValue(null);
      (ProductRepository.create as any).mockResolvedValue(mockProduct);
      (ProductImageRepository.create as any).mockResolvedValue({});
      (ProductRepository.findByIdPopulated as any).mockResolvedValue(mockProduct);

      const result = await ProductService.createProduct('owner1', {
        title: 'Canon 5D Camera',
        description: 'A professional camera for rent',
        category: 'cat1',
        rentalPrice: 500,
        priceUnit: 'day',
        condition: 'good' as any,
      }, ['url1', 'url2']);

      expect(result).toBeDefined();
      expect(ProductRepository.create).toHaveBeenCalled();
      expect(ProductImageRepository.create).toHaveBeenCalledTimes(2);
    });

    it('throws 404 when category not found', async () => {
      (CategoryRepository.findById as any).mockResolvedValue(null);
      await expect(
        ProductService.createProduct('owner1', {
          title: 'Canon 5D Camera',
          description: 'A professional camera for rent',
          category: 'cat1',
          rentalPrice: 500,
        })
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('appends suffix to duplicate slug', async () => {
      (CategoryRepository.findById as any).mockResolvedValue(mockCategory);
      (ProductRepository.findOne as any).mockResolvedValueOnce({ slug: 'canon-5d-camera' }).mockResolvedValueOnce(null);
      (ProductRepository.create as any).mockResolvedValue(mockProduct);
      (ProductRepository.findByIdPopulated as any).mockResolvedValue(mockProduct);

      await ProductService.createProduct('owner1', {
        title: 'Canon 5D Camera',
        description: 'A professional camera for rent',
        category: 'cat1',
        rentalPrice: 500,
      });
      expect(ProductRepository.findOne).toHaveBeenCalledTimes(2);
    });
  });

  describe('updateProduct', () => {
    it('updates own product', async () => {
      (ProductRepository.findById as any).mockResolvedValue({ ...mockProduct });
      (ProductRepository.updateById as any).mockResolvedValue(mockProduct);
      (ProductRepository.findByIdPopulated as any).mockResolvedValue(mockProduct);

      const result = await ProductService.updateProduct('prod1', 'owner1', { rentalPrice: 600 });
      expect(result).toBeDefined();
      expect(ProductRepository.updateById).toHaveBeenCalled();
    });

    it('throws 404 when not found', async () => {
      (ProductRepository.findById as any).mockResolvedValue(null);
      await expect(ProductService.updateProduct('prod1', 'owner1', {})).rejects.toMatchObject({ statusCode: 404 });
    });

    it('throws 403 when not owner', async () => {
      (ProductRepository.findById as any).mockResolvedValue({ ...mockProduct, owner: 'other' });
      await expect(ProductService.updateProduct('prod1', 'owner1', {})).rejects.toMatchObject({ statusCode: 403 });
    });
  });

  describe('deleteProduct', () => {
    it('deletes own product', async () => {
      (ProductRepository.findById as any).mockResolvedValue({ ...mockProduct });
      (ProductImageRepository.deleteForProduct as any).mockResolvedValue({});
      (ProductRepository.deleteById as any).mockResolvedValue({});
      await ProductService.deleteProduct('prod1', 'owner1');
      expect(ProductRepository.deleteById).toHaveBeenCalledWith('prod1');
    });

    it('throws 404 when not found', async () => {
      (ProductRepository.findById as any).mockResolvedValue(null);
      await expect(ProductService.deleteProduct('prod1')).rejects.toMatchObject({ statusCode: 404 });
    });

    it('throws 403 when not owner', async () => {
      (ProductRepository.findById as any).mockResolvedValue({ ...mockProduct, owner: 'other' });
      await expect(ProductService.deleteProduct('prod1', 'owner1')).rejects.toMatchObject({ statusCode: 403 });
    });
  });

  describe('listProducts', () => {
    it('lists active approved products with filters', async () => {
      (ProductRepository.listProducts as any).mockResolvedValue({ data: [], total: 0 });
      await ProductService.listProducts({ category: 'cat1', minPrice: 100, maxPrice: 500, sort: 'price_asc' });
      expect(ProductRepository.listProducts).toHaveBeenCalled();
    });
  });

  describe('getBySlug', () => {
    it('returns product by slug', async () => {
      (ProductRepository.findBySlug as any).mockResolvedValue(mockProduct);
      const result = await ProductService.getBySlug('canon-5d-camera');
      expect(result).toBeDefined();
    });

    it('throws 404 when not found', async () => {
      (ProductRepository.findBySlug as any).mockResolvedValue(null);
      await expect(ProductService.getBySlug('missing')).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('getById', () => {
    it('returns product by id', async () => {
      (ProductRepository.findByIdPopulated as any).mockResolvedValue(mockProduct);
      const result = await ProductService.getById('prod1');
      expect(result).toBeDefined();
    });

    it('throws 404 when not found', async () => {
      (ProductRepository.findByIdPopulated as any).mockResolvedValue(null);
      await expect(ProductService.getById('missing')).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('getOwnerProducts', () => {
    it('returns owner products', async () => {
      (ProductRepository.find as any).mockResolvedValue([mockProduct]);
      const result = await ProductService.getOwnerProducts('owner1');
      expect(result).toHaveLength(1);
    });
  });

  describe('blockDates', () => {
    it('blocks dates for own product', async () => {
      (ProductRepository.findById as any).mockResolvedValue({ ...mockProduct });
      (ProductAvailabilityRepository.findConflicts as any).mockResolvedValue([]);
      (ProductAvailabilityRepository.create as any).mockResolvedValue({});
      const result = await ProductService.blockDates('prod1', 'owner1', {
        reason: 'maintenance' as any,
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
      });
      expect(result).toBeDefined();
    });

    it('throws 409 on conflict', async () => {
      (ProductRepository.findById as any).mockResolvedValue({ ...mockProduct });
      (ProductAvailabilityRepository.findConflicts as any).mockResolvedValue([{ id: 'conflict' }]);
      await expect(
        ProductService.blockDates('prod1', 'owner1', {
          reason: 'maintenance' as any,
          startDate: new Date(),
          endDate: new Date(Date.now() + 86400000),
        })
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    it('throws 403 when not owner', async () => {
      (ProductRepository.findById as any).mockResolvedValue({ ...mockProduct, owner: 'other' });
      await expect(
        ProductService.blockDates('prod1', 'owner1', {
          reason: 'maintenance' as any,
          startDate: new Date(),
          endDate: new Date(Date.now() + 86400000),
        })
      ).rejects.toMatchObject({ statusCode: 403 });
    });
  });

  describe('getAvailability', () => {
    it('returns availability for product', async () => {
      (ProductRepository.findById as any).mockResolvedValue(mockProduct);
      (ProductAvailabilityRepository.findByProduct as any).mockResolvedValue([]);
      const result = await ProductService.getAvailability('prod1');
      expect(result).toEqual([]);
    });

    it('throws 404 when product not found', async () => {
      (ProductRepository.findById as any).mockResolvedValue(null);
      await expect(ProductService.getAvailability('missing')).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('removeBlock', () => {
    it('removes own block', async () => {
      (ProductAvailabilityRepository.findById as any).mockResolvedValue({ createdBy: 'owner1' });
      (ProductAvailabilityRepository.deleteById as any).mockResolvedValue({});
      await ProductService.removeBlock('block1', 'owner1');
      expect(ProductAvailabilityRepository.deleteById).toHaveBeenCalledWith('block1');
    });

    it('throws 404 when block not found', async () => {
      (ProductAvailabilityRepository.findById as any).mockResolvedValue(null);
      await expect(ProductService.removeBlock('block1', 'owner1')).rejects.toMatchObject({ statusCode: 404 });
    });

    it('throws 403 when not owner', async () => {
      (ProductAvailabilityRepository.findById as any).mockResolvedValue({ createdBy: 'other' });
      await expect(ProductService.removeBlock('block1', 'owner1')).rejects.toMatchObject({ statusCode: 403 });
    });
  });
});
