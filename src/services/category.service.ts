import ApiError from '../utils/ApiError';
import slugify from '../utils/slugify';
import CategoryRepository from '../repositories/CategoryRepository';
import Product from '../models/Product';
import { CreateCategoryInput } from '../validators/category';

export class CategoryService {
  async createCategory(input: CreateCategoryInput) {
    const slug = slugify(input.name);
    const existing = await CategoryRepository.findBySlug(slug);
    if (existing) {
      throw new ApiError(409, 'A category with this name already exists');
    }
    return CategoryRepository.create({
      name: input.name,
      slug,
      description: input.description || '',
      icon: input.icon || 'Folder',
      image: input.image || '',
      subcategories: input.subcategories || [],
    });
  }

  async updateCategory(id: string, input: Partial<CreateCategoryInput> & { status?: 'active' | 'inactive' }) {
    const category = await CategoryRepository.findById(id);
    if (!category) throw new ApiError(404, 'Category not found');

    const updateData: Record<string, unknown> = { ...input };
    if (input.name) updateData.slug = slugify(input.name);

    return CategoryRepository.updateById(id, updateData);
  }

  async deleteCategory(id: string): Promise<void> {
    const category = await CategoryRepository.findById(id);
    if (!category) throw new ApiError(404, 'Category not found');
    await CategoryRepository.deleteById(id);
  }

  async listCategories(includeInactive = false) {
    const categories = includeInactive
      ? await CategoryRepository.find({}, { sort: { name: 1 as 1 | -1 } })
      : await CategoryRepository.listActive();

    // Attach the real count of active, approved products per category.
    const counts = await Product.aggregate([
      { $match: { listingStatus: 'active', moderationStatus: 'approved' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]).exec();
    const countMap = new Map(counts.map((c) => [String(c._id), c.count as number]));

    return (categories as any[]).map((cat) => {
      const doc = cat.toObject ? cat.toObject() : cat;
      return {
        ...doc,
        itemCount: countMap.get(String(doc._id)) || 0,
        productCount: countMap.get(String(doc._id)) || 0,
      };
    });
  }

  async getBySlug(slug: string) {
    const category = await CategoryRepository.findBySlug(slug);
    if (!category) throw new ApiError(404, 'Category not found');
    return category;
  }

  async getById(id: string) {
    const category = await CategoryRepository.findById(id);
    if (!category) throw new ApiError(404, 'Category not found');
    return category;
  }
}

export default new CategoryService();

