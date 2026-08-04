import crypto from 'crypto';
import jwt, { SignOptions } from 'jsonwebtoken';
import env from '../config/env';

export interface TokenPayload {
  sub: string;
  role: string;
  jti?: string;
  [key: string]: unknown;
}

/**
 * Sign an access token (short-lived).
 */
export function signAccessToken(payload: TokenPayload): string {
  const options: SignOptions = { expiresIn: env.jwtAccessExpiresIn as SignOptions['expiresIn'] };
  return jwt.sign({ ...payload, jti: crypto.randomUUID() }, env.jwtAccessSecret, options);
}

/**
 * Sign a refresh token (long-lived).
 * Includes a unique jti (JWT ID) to prevent duplicate token collisions.
 */
export function signRefreshToken(payload: TokenPayload): string {
  const options: SignOptions = { expiresIn: env.jwtRefreshExpiresIn as SignOptions['expiresIn'] };
  return jwt.sign({ ...payload, jti: crypto.randomUUID() }, env.jwtRefreshSecret, options);
}

/**
 * Verify an access token.
 */
export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.jwtAccessSecret) as TokenPayload;
}

/**
 * Verify a refresh token.
 */
export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, env.jwtRefreshSecret) as TokenPayload;
}

/**
 * Decode a token without verifying (used for extracting expiry etc.).
 */
export function decodeToken(token: string): TokenPayload | null {
  const decoded = jwt.decode(token);
  return decoded as TokenPayload | null;
}

export default {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
};

