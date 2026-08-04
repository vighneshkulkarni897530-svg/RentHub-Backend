import { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Wraps async route handlers so rejected promises are forwarded
 * to the centralized error handler (avoids try/catch boilerplate).
 */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export default asyncHandler;

