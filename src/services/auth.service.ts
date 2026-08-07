import crypto from 'crypto';
import ApiError from '../utils/ApiError';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import UserRepository from '../repositories/UserRepository';
import RefreshTokenRepository from '../repositories/RefreshTokenRepository';
import emailService from './email.service';
import { RegisterInput, LoginInput } from '../validators/auth';
import { UserRole } from '../models/User';

const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 min

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
}

export class AuthService {
  async register(input: RegisterInput) {
    const existing = await UserRepository.isEmailTaken(input.email);
    if (existing) {
      throw new ApiError(409, 'An account with this email already exists');
    }

    const user = await UserRepository.create({
      name: input.name,
      email: input.email,
      password: input.password,
      role: input.role as UserRole,
      phone: input.phone || '',
      isEmailVerified: false,
      verified: false,
    });

    const verificationToken = crypto.randomBytes(32).toString('hex');
    await UserRepository.updateTokens(user.id, {
      emailVerificationToken: crypto.createHash('sha256').update(verificationToken).digest('hex'),
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    // Fire-and-forget emails (won't block registration if SMTP not configured)
    void emailService.sendWelcomeEmail(user.email, user.name);
    void emailService.sendVerificationEmail(user.email, user.name, verificationToken);

    const tokens = await this.generateTokens(user.id, user.role);

    return { user: this.toPublicUser(user), ...tokens };
  }

  async login(input: LoginInput) {
    const user = await UserRepository.findByEmailForAuth(input.email);
    if (!user || !(await user.comparePassword(input.password))) {
      throw new ApiError(401, 'Invalid email or password');
    }
    if (!user.isEmailVerified) {
      throw new ApiError(403, 'Please verify your email address before logging in');
    }
    if (user.status === 'suspended') {
      throw new ApiError(403, 'Your account has been suspended. Contact support.');
    }

    await UserRepository.updateById(user.id, { lastActive: new Date() });

    const tokens = await this.generateTokens(user.id, user.role);
    return { user: this.toPublicUser(user), ...tokens };
  }

  async refreshTokens(refreshToken: string) {
    let payload: { sub: string; role: string };
    try {
      payload = verifyRefreshToken(refreshToken) as any;
    } catch {
      throw new ApiError(401, 'Invalid or expired refresh token');
    }

    const stored = await RefreshTokenRepository.findByToken(refreshToken);
    if (!stored) {
      throw new ApiError(401, 'Refresh token has been revoked');
    }
    if (stored.expiresAt < new Date()) {
      await RefreshTokenRepository.revoke(refreshToken);
      throw new ApiError(401, 'Refresh token has expired');
    }

    const user = await UserRepository.findByIdWithRole(payload.sub);
    if (!user) throw new ApiError(401, 'User no longer exists');

    // Rotate refresh token
    await RefreshTokenRepository.revoke(refreshToken);
    const tokens = await this.generateTokens(user.id, user.role);

    return { user: this.toPublicUser(user), ...tokens };
  }

  async logout(refreshToken: string): Promise<void> {
    await RefreshTokenRepository.revoke(refreshToken);
  }

  async logoutAll(userId: string): Promise<void> {
    await RefreshTokenRepository.revokeAllForUser(userId);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await UserRepository.findByEmail(email);
    if (!user) return; // Don't leak whether the email exists

    const resetToken = crypto.randomBytes(32).toString('hex');
    await UserRepository.updateTokens(user.id, {
      resetPasswordToken: crypto.createHash('sha256').update(resetToken).digest('hex'),
      resetPasswordExpires: new Date(Date.now() + 60 * 60 * 1000),
    });

    void emailService.sendPasswordResetEmail(user.email, user.name, resetToken);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await UserRepository.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });
    if (!user) throw new ApiError(400, 'Invalid or expired reset token');

    await UserRepository.updateById(user.id, {
      password: newPassword,
      resetPasswordToken: undefined,
      resetPasswordExpires: undefined,
    });
  }

  async verifyEmail(token: string): Promise<void> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await UserRepository.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: new Date() },
    });
    if (!user) throw new ApiError(400, 'Invalid or expired verification token');

    await UserRepository.updateById(user.id, {
      isEmailVerified: true,
      verified: true,
      emailVerificationToken: undefined,
      emailVerificationExpires: undefined,
    });
  }

  async resendVerification(email: string): Promise<void> {
    const user = await UserRepository.findByEmail(email);
    if (!user || user.isEmailVerified) return;

    const verificationToken = crypto.randomBytes(32).toString('hex');
    await UserRepository.updateTokens(user.id, {
      emailVerificationToken: crypto.createHash('sha256').update(verificationToken).digest('hex'),
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    void emailService.sendVerificationEmail(user.email, user.name, verificationToken);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    // Single query that includes the password field (avoids N+1).
    const user = await UserRepository.findByIdWithPassword(userId);
    if (!user) throw new ApiError(404, 'User not found');
    if (!(await user.comparePassword(currentPassword))) {
      throw new ApiError(401, 'Current password is incorrect');
    }
    await UserRepository.updateById(userId, { password: newPassword });
  }

  async getProfile(userId: string) {
    const user = await UserRepository.findByIdWithRole(userId);
    if (!user) throw new ApiError(404, 'User not found');
    return this.toPublicUser(user);
  }

  private async generateTokens(userId: string, role: string): Promise<AuthTokens> {
    const accessToken = signAccessToken({ sub: userId, role });
    const refreshToken = signRefreshToken({ sub: userId, role });

    await RefreshTokenRepository.create({
      user: userId as any,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return { accessToken, refreshToken, accessTokenExpiresIn: ACCESS_TOKEN_TTL_MS };
  }

  private toPublicUser(user: any) {
    return {
      id: user._id?.toString() || user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      phone: user.phone,
      role: user.role,
      status: user.status,
      verified: user.verified,
      isEmailVerified: user.isEmailVerified,
      kycStatus: user.kycStatus,
      wallet: user.wallet || {
        balance: 0,
        refundBalance: 0,
        credit: 0,
        rewardPoints: 0,
        transactions: [],
      },
      location: user.location,
      rating: user.rating,
      totalRentals: user.totalRentals,
      totalListings: user.totalListings,
      storeName: user.storeName,
      storeDescription: user.storeDescription,
      documents: user.documents || [],
      createdAt: user.createdAt,
    };
  }
}

export default new AuthService();
