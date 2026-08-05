// AuthService unit tests — repositories mocked via vi.mock
// NOTE: uses globals (describe/it/expect/vi) — do NOT import from 'vitest'

vi.mock('../../../src/repositories/UserRepository', () => ({
  default: {
    isEmailTaken: vi.fn(),
    create: vi.fn(),
    updateTokens: vi.fn(),
    updateById: vi.fn(),
    findByEmailForAuth: vi.fn(),
    findByIdWithRole: vi.fn(),
    findByEmail: vi.fn(),
    findOne: vi.fn(),
    countDocuments: vi.fn(),
  },
}));

vi.mock('../../../src/repositories/RefreshTokenRepository', () => ({
  default: {
    create: vi.fn(),
    findByToken: vi.fn(),
    revoke: vi.fn(),
    revokeAllForUser: vi.fn(),
  },
}));

vi.mock('../../../src/services/email.service', () => ({
  default: {
    sendWelcomeEmail: vi.fn().mockResolvedValue(undefined),
    sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
  },
}));

import AuthService from '../../../src/services/auth.service';
import UserRepository from '../../../src/repositories/UserRepository';
import RefreshTokenRepository from '../../../src/repositories/RefreshTokenRepository';
import emailService from '../../../src/services/email.service';
import ApiError from '../../../src/utils/ApiError';

const mockUser = {
  _id: 'user1',
  id: 'user1',
  name: 'Test User',
  email: 'test@test.com',
  password: 'hashed',
  role: 'customer',
  avatar: '',
  phone: '',
  status: 'active',
  verified: false,
  isEmailVerified: true,
  kycStatus: 'none',
  wallet: { balance: 0, refundBalance: 0, credit: 0, rewardPoints: 0, transactions: [] },
  location: undefined,
  rating: 0,
  totalRentals: 0,
  totalListings: 0,
  storeName: '',
  storeDescription: '',
  documents: [],
  createdAt: new Date(),
  comparePassword: vi.fn().mockResolvedValue(true),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AuthService', () => {
  describe('register', () => {
    it('creates a user and returns tokens', async () => {
      (UserRepository.isEmailTaken as any).mockResolvedValue(false);
      (UserRepository.create as any).mockResolvedValue(mockUser);
      (UserRepository.updateTokens as any).mockResolvedValue(mockUser);
      (RefreshTokenRepository.create as any).mockResolvedValue({});

      const result = await AuthService.register({
        name: 'Test User',
        email: 'test@test.com',
        password: 'Password1',
        confirmPassword: 'Password1',
        role: 'customer',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe('test@test.com');
      expect(emailService.sendWelcomeEmail).toHaveBeenCalled();
      expect(emailService.sendVerificationEmail).toHaveBeenCalled();
    });

    it('throws 409 when email is taken', async () => {
      (UserRepository.isEmailTaken as any).mockResolvedValue(true);
      await expect(
        AuthService.register({
          name: 'Test',
          email: 'taken@test.com',
          password: 'Password1',
          confirmPassword: 'Password1',
          role: 'customer',
        })
      ).rejects.toBeInstanceOf(ApiError);
      await expect(
        AuthService.register({
          name: 'Test',
          email: 'taken@test.com',
          password: 'Password1',
          confirmPassword: 'Password1',
          role: 'customer',
        })
      ).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  describe('login', () => {
    it('returns tokens for valid credentials', async () => {
      (UserRepository.findByEmailForAuth as any).mockResolvedValue(mockUser);
      (UserRepository.updateById as any).mockResolvedValue(mockUser);
      (RefreshTokenRepository.create as any).mockResolvedValue({});

      const result = await AuthService.login({ email: 'test@test.com', password: 'Password1' });
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(UserRepository.updateById).toHaveBeenCalled();
    });

    it('throws 401 for invalid password', async () => {
      const user = { ...mockUser, comparePassword: vi.fn().mockResolvedValue(false) };
      (UserRepository.findByEmailForAuth as any).mockResolvedValue(user);
      await expect(AuthService.login({ email: 'test@test.com', password: 'wrong' })).rejects.toMatchObject({
        statusCode: 401,
      });
    });

    it('throws 403 when email not verified', async () => {
      const user = { ...mockUser, isEmailVerified: false };
      (UserRepository.findByEmailForAuth as any).mockResolvedValue(user);
      await expect(AuthService.login({ email: 'test@test.com', password: 'Password1' })).rejects.toMatchObject({
        statusCode: 403,
      });
    });

    it('throws 403 when suspended', async () => {
      const user = { ...mockUser, status: 'suspended' };
      (UserRepository.findByEmailForAuth as any).mockResolvedValue(user);
      await expect(AuthService.login({ email: 'test@test.com', password: 'Password1' })).rejects.toMatchObject({
        statusCode: 403,
      });
    });

    it('throws 401 when user not found', async () => {
      (UserRepository.findByEmailForAuth as any).mockResolvedValue(null);
      await expect(AuthService.login({ email: 'nouser@test.com', password: 'Password1' })).rejects.toMatchObject({
        statusCode: 401,
      });
    });
  });

  describe('refreshTokens', () => {
it('rotates tokens on valid refresh token', async () => {
      const jwt = require('jsonwebtoken');
      const token = jwt.sign({ sub: 'user1', role: 'customer' }, 'test_refresh_secret', { expiresIn: '7d' });
      (RefreshTokenRepository.findByToken as any).mockResolvedValue({ token, expiresAt: new Date(Date.now() + 100000) });
      (UserRepository.findByIdWithRole as any).mockResolvedValue(mockUser);
      (RefreshTokenRepository.revoke as any).mockResolvedValue({});
      (RefreshTokenRepository.create as any).mockResolvedValue({});

      const result = await AuthService.refreshTokens(token);
      expect(result).toHaveProperty('accessToken');
      expect(RefreshTokenRepository.revoke).toHaveBeenCalledWith(token);
    });

    it('throws 401 for invalid token', async () => {
      await expect(AuthService.refreshTokens('bad.token')).rejects.toMatchObject({ statusCode: 401 });
    });

    it('throws 401 when refresh token revoked', async () => {
      const token = 'valid.refresh.token';
      (RefreshTokenRepository.findByToken as any).mockResolvedValue(null);
      await expect(AuthService.refreshTokens(token)).rejects.toMatchObject({ statusCode: 401 });
    });

    it('throws 401 when refresh token expired', async () => {
      const token = 'valid.refresh.token';
      const payload = { sub: 'user1', role: 'customer' };
      // Use the real jwt util to create a valid token via refresh secret
      const jwt = require('jsonwebtoken');
      const realToken = jwt.sign(payload, 'dev_refresh_secret', { expiresIn: '-1h' });
      (RefreshTokenRepository.findByToken as any).mockResolvedValue({
        token: realToken,
        expiresAt: new Date(Date.now() - 100000),
      });
      await expect(AuthService.refreshTokens(realToken)).rejects.toMatchObject({ statusCode: 401 });
    });
  });

  describe('logout', () => {
    it('revokes the refresh token', async () => {
      (RefreshTokenRepository.revoke as any).mockResolvedValue({});
      await AuthService.logout('token123');
      expect(RefreshTokenRepository.revoke).toHaveBeenCalledWith('token123');
    });
  });

  describe('logoutAll', () => {
    it('revokes all tokens for user', async () => {
      (RefreshTokenRepository.revokeAllForUser as any).mockResolvedValue({});
      await AuthService.logoutAll('user1');
      expect(RefreshTokenRepository.revokeAllForUser).toHaveBeenCalledWith('user1');
    });
  });

  describe('forgotPassword', () => {
    it('sends reset email when user exists', async () => {
      (UserRepository.findByEmail as any).mockResolvedValue(mockUser);
      (UserRepository.updateTokens as any).mockResolvedValue(mockUser);
      await AuthService.forgotPassword('test@test.com');
      expect(UserRepository.updateTokens).toHaveBeenCalled();
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalled();
    });

    it('does not throw when user does not exist', async () => {
      (UserRepository.findByEmail as any).mockResolvedValue(null);
      await expect(AuthService.forgotPassword('nobody@test.com')).resolves.toBeUndefined();
    });
  });

  describe('resetPassword', () => {
    it('resets password with valid token', async () => {
      (UserRepository.findOne as any).mockResolvedValue(mockUser);
      (UserRepository.updateById as any).mockResolvedValue(mockUser);
      await AuthService.resetPassword('reset-token', 'NewPassword1');
      expect(UserRepository.updateById).toHaveBeenCalled();
    });

    it('throws 400 for invalid token', async () => {
      (UserRepository.findOne as any).mockResolvedValue(null);
      await expect(AuthService.resetPassword('bad-token', 'NewPassword1')).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('verifyEmail', () => {
    it('verifies email with valid token', async () => {
      (UserRepository.findOne as any).mockResolvedValue(mockUser);
      (UserRepository.updateById as any).mockResolvedValue(mockUser);
      await AuthService.verifyEmail('verify-token');
      expect(UserRepository.updateById).toHaveBeenCalledWith(
        'user1',
        expect.objectContaining({ isEmailVerified: true, verified: true })
      );
    });

    it('throws 400 for invalid token', async () => {
      (UserRepository.findOne as any).mockResolvedValue(null);
      await expect(AuthService.verifyEmail('bad-token')).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('resendVerification', () => {
    it('sends verification email', async () => {
      (UserRepository.findByEmail as any).mockResolvedValue({ ...mockUser, isEmailVerified: false });
      (UserRepository.updateTokens as any).mockResolvedValue(mockUser);
      await AuthService.resendVerification('test@test.com');
      expect(emailService.sendVerificationEmail).toHaveBeenCalled();
    });

    it('does nothing when user is already verified', async () => {
      (UserRepository.findByEmail as any).mockResolvedValue({ ...mockUser, isEmailVerified: true });
      await AuthService.resendVerification('test@test.com');
      expect(UserRepository.updateTokens).not.toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
it('changes password with correct current password', async () => {
      const user = {
        ...mockUser,
        constructor: {
          findById: vi.fn(() => ({
            select: vi.fn().mockResolvedValue({ ...mockUser, comparePassword: vi.fn().mockResolvedValue(true) }),
          })),
        },
      };
      (UserRepository.findByIdWithRole as any).mockResolvedValue(user);
      (UserRepository.updateById as any).mockResolvedValue(mockUser);
      await AuthService.changePassword('user1', 'CurrentPass1', 'NewPassword1');
      expect(UserRepository.updateById).toHaveBeenCalled();
    });

    it('throws 404 when user not found', async () => {
      (UserRepository.findByIdWithRole as any).mockResolvedValue(null);
      await expect(AuthService.changePassword('x', 'CurrentPass1', 'NewPassword1')).rejects.toMatchObject({
        statusCode: 404,
      });
    });

it('throws 401 when current password incorrect', async () => {
      const user = {
        ...mockUser,
        constructor: {
          findById: vi.fn(() => ({
            select: vi.fn().mockResolvedValue({ ...mockUser, comparePassword: vi.fn().mockResolvedValue(false) }),
          })),
        },
      };
      (UserRepository.findByIdWithRole as any).mockResolvedValue(user);
      await expect(AuthService.changePassword('user1', 'WrongPass1', 'NewPassword1')).rejects.toMatchObject({
        statusCode: 401,
      });
    });
  });

  describe('getProfile', () => {
    it('returns public user profile', async () => {
      (UserRepository.findByIdWithRole as any).mockResolvedValue(mockUser);
      const result = await AuthService.getProfile('user1');
      expect(result.email).toBe('test@test.com');
    });

    it('throws 404 when not found', async () => {
      (UserRepository.findByIdWithRole as any).mockResolvedValue(null);
      await expect(AuthService.getProfile('missing')).rejects.toMatchObject({ statusCode: 404 });
    });
  });
});
