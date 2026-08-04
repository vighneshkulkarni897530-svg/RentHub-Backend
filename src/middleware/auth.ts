import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import env from '../config/env';
import User from '../models/User';
import ApiError from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { UserRole } from '../models/User';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
    name?: string;
    email?: string;
    verified?: boolean;
  };
}

/**
 * JWT authentication middleware.
 * Verifies the Bearer token and attaches the user payload to req.user.
 */
export const authenticate = asyncHandler(async (req: AuthRequest, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw new ApiError(401, 'Authentication required. Please log in.');
  }

  const token = header.split(' ')[1];
  let decoded: any;
  try {
    decoded = jwt.verify(token, env.jwtAccessSecret);
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new ApiError(401, 'Your session has expired. Please log in again.');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new ApiError(401, 'Invalid token. Please log in again.');
    }
    throw new ApiError(401, 'Authentication failed.');
  }

  const user = await User.findById(decoded.sub).select('name email role status verified');
  if (!user) throw new ApiError(401, 'The user belonging to this token no longer exists.');

  if (user.status === 'suspended') {
    throw new ApiError(403, 'Your account has been suspended. Contact support.');
  }

  req.user = {
    id: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    verified: user.verified,
  };

  next();
});

/**
 * Role-based authorization middleware.
 * Usage: authorize('admin') or authorize('owner', 'admin')
 */
export const authorize =
  (...roles: UserRole[]) =>
  (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required.'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission to access this resource.'));
    }
    return next();
  };

export default { authenticate, authorize };

