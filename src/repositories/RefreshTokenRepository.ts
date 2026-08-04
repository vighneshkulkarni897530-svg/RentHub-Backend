import RefreshToken, { IRefreshToken } from '../models/RefreshToken';
import BaseRepository from './BaseRepository';

class RefreshTokenRepository extends BaseRepository<IRefreshToken> {
  constructor() {
    super(RefreshToken);
  }

  async findByToken(token: string): Promise<IRefreshToken | null> {
    return RefreshToken.findOne({ token, revoked: false }).exec();
  }

  async revoke(token: string): Promise<void> {
    await RefreshToken.updateOne({ token }, { $set: { revoked: true } }).exec();
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await RefreshToken.updateMany({ user: userId }, { $set: { revoked: true } }).exec();
  }

  async deleteExpired(): Promise<number> {
    const result = await RefreshToken.deleteMany({ expiresAt: { $lt: new Date() } }).exec();
    return result.deletedCount || 0;
  }
}

export default new RefreshTokenRepository();

