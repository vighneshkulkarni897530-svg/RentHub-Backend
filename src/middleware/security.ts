import { NextFunction, Request, Response } from 'express';
import crypto from 'crypto';
import env from '../config/env';

/**
 * Adds a unique request ID to each request (for tracing/log correlation).
 * Looks for X-Request-Id header first, otherwise generates a UUID.
 */
export function requestId(req: Request, res: Response, next: NextFunction) {
  const existing = req.headers['x-request-id'];
  const id = Array.isArray(existing) ? existing[0] : existing || crypto.randomUUID();
  res.setHeader('X-Request-Id', id);
  (req as any).requestId = id;
  next();
}

/**
 * Sanitize incoming request data to prevent MongoDB query selector injection.
 * Recursively strips keys starting with `$` and removes `__proto__`/`constructor`
 * from body, query, and params.
 */
export function mongoSanitize() {
  return function mongoSanitizeMiddleware(req: Request, _res: Response, next: NextFunction) {
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeValue(req.body);
    }
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeValue(req.query);
    }
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeValue(req.params);
    }
    next();
  };
}

function sanitizeValue<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((v) => sanitizeValue(v)) as unknown as T;
  }
  if (value && typeof value === 'object') {
    const clean: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>)) {
      // Strip MongoDB operators and prototype-pollution keys
      if (key.startsWith('$') || key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      clean[key] = sanitizeValue((value as Record<string, unknown>)[key]);
    }
    return clean as unknown as T;
  }
  return value;
}

/**
 * Cookie security configuration helper.
 * Returns standard cookie options for production (secure, httpOnly, sameSite).
 */
export function cookieSecurityOptions() {
  return {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'lax' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
}

export default { requestId, mongoSanitize, cookieSecurityOptions };
