import { Model, Document, FilterQuery, PopulateOptions, QueryOptions, UpdateQuery } from 'mongoose';

/**
 * Generic base repository providing common CRUD operations
 * so concrete repositories stay focused and consistent.
 */
export abstract class BaseRepository<T extends Document> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async create(data: Partial<T>): Promise<T> {
    return this.model.create(data);
  }

  async findById(id: string, populate?: PopulateOptions | PopulateOptions[]): Promise<T | null> {
    let query = this.model.findById(id);
    if (populate) query = query.populate(populate);
    return query.exec();
  }

  async findOne(
    filter: FilterQuery<T>,
    populate?: PopulateOptions | PopulateOptions[]
  ): Promise<T | null> {
    let query = this.model.findOne(filter);
    if (populate) query = query.populate(populate);
    return query.exec();
  }

  async find(
    filter: FilterQuery<T> = {},
    options: {
      populate?: PopulateOptions | PopulateOptions[];
      sort?: Record<string, 1 | -1>;
      limit?: number;
      skip?: number;
      select?: string;
    } = {}
  ): Promise<T[]> {
    const query = this.model.find(filter).lean();
    if (options.select) query.select(options.select);
    if (options.populate) query.populate(options.populate);
    if (options.sort) query.sort(options.sort);
    if (options.limit) query.limit(options.limit);
    if (options.skip) query.skip(options.skip);
    return (await query.exec()) as T[];
  }

  async updateById(id: string, data: UpdateQuery<T>): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true, runValidators: true }).exec();
  }

  async updateOne(filter: FilterQuery<T>, data: UpdateQuery<T>): Promise<T | null> {
    return this.model.findOneAndUpdate(filter, data, { new: true, runValidators: true }).exec();
  }

  async deleteById(id: string): Promise<T | null> {
    return this.model.findByIdAndDelete(id).exec();
  }

  async deleteMany(filter: FilterQuery<T>): Promise<{ deletedCount: number }> {
    const result = await this.model.deleteMany(filter).exec();
    return { deletedCount: result.deletedCount || 0 };
  }

  async countDocuments(filter: FilterQuery<T> = {}): Promise<number> {
    return this.model.countDocuments(filter).exec();
  }

  async findOneAndUpdate(
    filter: FilterQuery<T>,
    data: UpdateQuery<T>,
    options: QueryOptions = {}
  ): Promise<T | null> {
    return this.model.findOneAndUpdate(filter, data, {
      new: true,
      runValidators: true,
      ...options,
    }).exec();
  }
}

export default BaseRepository;

