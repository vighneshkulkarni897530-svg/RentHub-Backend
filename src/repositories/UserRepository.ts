import { FilterQuery } from 'mongoose';
import User, { IUser, IUserModel } from '../models/User';
import BaseRepository from './BaseRepository';

class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(User);
  }

  async findByEmail(email: string, withPassword = false): Promise<IUser | null> {
    const result = withPassword
      ? await User.findOne({ email: email.toLowerCase() }).select('+password').exec()
      : await User.findOne({ email: email.toLowerCase() }).exec();
    return (result as unknown) as IUser | null;
  }

  async findByEmailForAuth(email: string): Promise<IUser | null> {
    const result = await User.findOne({ email: email.toLowerCase() })
      .select(
        '+password name email avatar phone role status verified isEmailVerified location storeName storeDescription wallet kycStatus documents'
      )
      .exec();
    return result as unknown as IUser | null;
  }

  async isEmailTaken(email: string, excludeId?: string): Promise<boolean> {
    return (User as IUserModel).isEmailTaken(email, excludeId);
  }

  async updateTokens(
    id: string,
    data: { resetPasswordToken?: string; resetPasswordExpires?: Date; emailVerificationToken?: string; emailVerificationExpires?: Date }
  ): Promise<IUser | null> {
    return this.updateById(id, data);
  }

  async findByIdWithRole(id: string): Promise<IUser | null> {
    return User.findById(id).exec();
  }

  async findByIdWithPassword(id: string): Promise<IUser | null> {
    return User.findById(id).select('+password').exec() as unknown as IUser | null;
  }

  async listUsers(filter: FilterQuery<IUser> = {}, options: { page?: number; limit?: number; sort?: string } = {}) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;
    const total = await this.countDocuments(filter);
    const data = await this.find(filter, { sort: { createdAt: -1 as 1 | -1 }, skip, limit });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}

export default new UserRepository();
