import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
} from '../../../src/utils/jwt';

describe('jwt utils', () => {
  describe('signAccessToken', () => {
    it('returns a token string', () => {
      const token = signAccessToken({ sub: 'user123', role: 'customer' });
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('embeds sub and role in payload', () => {
      const token = signAccessToken({ sub: 'abc123', role: 'owner' });
      const decoded = decodeToken(token);
      expect(decoded?.sub).toBe('abc123');
      expect(decoded?.role).toBe('owner');
    });
  });

  describe('signRefreshToken', () => {
    it('returns a token with a unique jti', () => {
      const t1 = signRefreshToken({ sub: 'u1', role: 'customer' });
      const t2 = signRefreshToken({ sub: 'u1', role: 'customer' });
      const d1 = decodeToken(t1);
      const d2 = decodeToken(t2);
      expect(d1?.jti).toBeDefined();
      expect(d1?.jti).not.toBe(d2?.jti);
    });
  });

  describe('verifyAccessToken', () => {
    it('verifies a valid token', () => {
      const token = signAccessToken({ sub: 'u1', role: 'admin' });
      const payload = verifyAccessToken(token);
      expect(payload.sub).toBe('u1');
      expect(payload.role).toBe('admin');
    });

    it('throws on invalid token', () => {
      expect(() => verifyAccessToken('not.a.token')).toThrow();
    });
  });

  describe('verifyRefreshToken', () => {
    it('verifies a valid refresh token', () => {
      const token = signRefreshToken({ sub: 'u1', role: 'customer' });
      const payload = verifyRefreshToken(token);
      expect(payload.sub).toBe('u1');
    });

    it('throws on invalid refresh token', () => {
      expect(() => verifyRefreshToken('invalid')).toThrow();
    });
  });

  describe('decodeToken', () => {
    it('returns null for non-token input', () => {
      expect(decodeToken('garbage')).toBeNull();
    });

    it('decodes a valid token without verifying', () => {
      const token = signAccessToken({ sub: 'u1', role: 'owner' });
      const decoded = decodeToken(token);
      expect(decoded?.sub).toBe('u1');
    });
  });
});
