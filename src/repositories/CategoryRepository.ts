import Category, { ICategory } from '../models/Category';
import BaseRepository from './BaseRepository';

class CategoryRepository extends BaseRepository<ICategory> {
  constructor() {
    super(Category);
  }

  async findBySlug(slug: string): Promise<ICategory | null> {
    return Category.findOne({ slug }).exec();
  }

  async findByName(name: string | RegExp): Promise<ICategory | null> {
    return Category.findOne({ name }).exec();
  }

  async listActive(): Promise<ICategory[]> {
    return this.find({ status: 'active' }, { sort: { name: 1 as 1 | -1 } });
  }
}

export default new CategoryRepository();