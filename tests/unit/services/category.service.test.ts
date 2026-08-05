// CategoryService unit tests — repositories mocked via vi.mock

vi.mock('../../../src/repositories/CategoryRepository', () => ({
  default: {
    findBySlug: vi.fn(),
    create: vi.fn(),
    findById: vi.fn(),
    updateById: vi.fn(),
    deleteById: vi.fn(),
    find: vi.fn(),
    listActive: vi.fn(),
  },
}));

import CategoryService from '../../../src/services/category.service';
import CategoryRepository from '../../../src/repositories/CategoryRepository';

const mockCategory = { _id: 'cat1', name: 'Cameras', slug: 'cameras', description: '', icon: 'Folder', image: '', subcategories: [] };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('CategoryService', () => {
  describe('createCategory', () => {
    it('creates a category', async () => {
      (CategoryRepository.findBySlug as any).mockResolvedValue(null);
      (CategoryRepository.create as any).mockResolvedValue(mockCategory);
      const result = await CategoryService.createCategory({ name: 'Cameras' });
      expect(result).toBeDefined();
      expect(CategoryRepository.create).toHaveBeenCalled();
    });

    it('throws 409 when slug exists', async () => {
      (CategoryRepository.findBySlug as any).mockResolvedValue(mockCategory);
      await expect(CategoryService.createCategory({ name: 'Cameras' })).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  describe('updateCategory', () => {
    it('updates a category', async () => {
      (CategoryRepository.findById as any).mockResolvedValue(mockCategory);
      (CategoryRepository.updateById as any).mockResolvedValue(mockCategory);
      const result = await CategoryService.updateCategory('cat1', { name: 'Cameras Pro' });
      expect(result).toBeDefined();
      expect(CategoryRepository.updateById).toHaveBeenCalled();
    });

    it('throws 404 when not found', async () => {
      (CategoryRepository.findById as any).mockResolvedValue(null);
      await expect(CategoryService.updateCategory('cat1', { name: 'x' })).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('deleteCategory', () => {
    it('deletes a category', async () => {
      (CategoryRepository.findById as any).mockResolvedValue(mockCategory);
      (CategoryRepository.deleteById as any).mockResolvedValue({});
      await CategoryService.deleteCategory('cat1');
      expect(CategoryRepository.deleteById).toHaveBeenCalledWith('cat1');
    });

    it('throws 404 when not found', async () => {
      (CategoryRepository.findById as any).mockResolvedValue(null);
      await expect(CategoryService.deleteCategory('cat1')).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('listCategories', () => {
    it('lists active categories by default', async () => {
      (CategoryRepository.listActive as any).mockResolvedValue([mockCategory]);
      const result = await CategoryService.listCategories();
      expect(result).toEqual([mockCategory]);
    });

    it('lists all categories when includeInactive', async () => {
      (CategoryRepository.find as any).mockResolvedValue([mockCategory]);
      const result = await CategoryService.listCategories(true);
      expect(result).toEqual([mockCategory]);
    });
  });

  describe('getBySlug', () => {
    it('returns category by slug', async () => {
      (CategoryRepository.findBySlug as any).mockResolvedValue(mockCategory);
      const result = await CategoryService.getBySlug('cameras');
      expect(result).toEqual(mockCategory);
    });

    it('throws 404 when not found', async () => {
      (CategoryRepository.findBySlug as any).mockResolvedValue(null);
      await expect(CategoryService.getBySlug('missing')).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('getById', () => {
    it('returns category by id', async () => {
      (CategoryRepository.findById as any).mockResolvedValue(mockCategory);
      const result = await CategoryService.getById('cat1');
      expect(result).toEqual(mockCategory);
    });

    it('throws 404 when not found', async () => {
      (CategoryRepository.findById as any).mockResolvedValue(null);
      await expect(CategoryService.getById('cat1')).rejects.toMatchObject({ statusCode: 404 });
    });
  });
});
