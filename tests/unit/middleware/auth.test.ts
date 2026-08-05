import jwt from 'jsonwebtoken';
import env from '../../../src/config/env';

// Mock the User model before importing auth middleware
vi.mock('../../../src/models/User', () => ({
  default: {
    findById: vi.fn(() => ({
      select: vi.fn().mockResolvedValue(null),
    })),
  },
}));

// Mock ApiError
vi.mock('../../../src/utils/ApiError', () => {
  class FakeApiError extends Error {
    statusCode: number;
    constructor(statusCode: number, message: string) {
      super(message);
      this.statusCode = statusCode;
    }
  }
  return { default: FakeApiError };
});

import { authenticate, authorize } from '../../../src/middleware/auth';
import User from '../../../src/models/User';

describe('auth middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authenticate', () => {
    it('throws 401 when no Authorization header', async () => {
      const req = { headers: {} } as any;
      const next = vi.fn();
      await authenticate(req as any, {} as any, next);
      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0].statusCode).toBe(401);
    });

    it('throws 401 for invalid token', async () => {
      const req = { headers: { authorization: 'Bearer invalid.token.here' } } as any;
      const next = vi.fn();
      await authenticate(req as any, {} as any, next);
      expect(next.mock.calls[0][0].statusCode).toBe(401);
    });

it('attaches user to req for valid token', async () => {
      const token = jwt.sign({ sub: 'user123', role: 'customer' }, env.jwtAccessSecret, { expiresIn: '15m' });
      (User.findById as any).mockImplementation(() => ({
        select: vi.fn().mockResolvedValue({
          id: 'user123',
          role: 'customer',
          name: 'Test',
          email: 'test@test.com',
          status: 'active',
          verified: true,
        }),
      }));
      const req = { headers: { authorization: `Bearer ${token}` } } as any;
      const next = vi.fn();
      await authenticate(req as any, {} as any, next);
      expect(req.user).toBeDefined();
      expect(req.user.id).toBe('user123');
      expect(next).toHaveBeenCalledWith();
    });

it('throws 401 when user no longer exists', async () => {
      const token = jwt.sign({ sub: 'gone', role: 'customer' }, env.jwtAccessSecret, { expiresIn: '15m' });
      (User.findById as any).mockImplementation(() => ({
        select: vi.fn().mockResolvedValue(null),
      }));
      const req = { headers: { authorization: `Bearer ${token}` } } as any;
      const next = vi.fn();
      await authenticate(req as any, {} as any, next);
      await new Promise((r) => setTimeout(r, 0));
      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0].statusCode).toBe(401);
    });

    it('throws 403 when user is suspended', async () => {
      const token = jwt.sign({ sub: 'susp', role: 'customer' }, env.jwtAccessSecret, { expiresIn: '15m' });
      (User.findById as any).mockImplementation(() => ({
        select: vi.fn().mockResolvedValue({ id: 'susp', role: 'customer', status: 'suspended' }),
      }));
      const req = { headers: { authorization: `Bearer ${token}` } } as any;
      const next = vi.fn();
      await authenticate(req as any, {} as any, next);
      await new Promise((r) => setTimeout(r, 0));
      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0].statusCode).toBe(403);
    });
  });

  describe('authorize', () => {
    it('allows matching role', () => {
      const req = { user: { id: '1', role: 'admin' } } as any;
      const next = vi.fn();
      authorize('admin')(req, {} as any, next);
      expect(next).toHaveBeenCalledWith();
    });

    it('denies non-matching role with 403', () => {
      const req = { user: { id: '1', role: 'customer' } } as any;
      const next = vi.fn();
      authorize('admin')(req, {} as any, next);
      expect(next.mock.calls[0][0].statusCode).toBe(403);
    });

    it('throws 401 when no user', () => {
      const req = {} as any;
      const next = vi.fn();
      authorize('admin')(req, {} as any, next);
      expect(next.mock.calls[0][0].statusCode).toBe(401);
    });
  });
});
