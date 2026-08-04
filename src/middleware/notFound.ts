import { Request, Response } from 'express';
import ApiError from '../utils/ApiError';

/**
 * 404 handler for unmatched routes.
 */
export const notFound = (req: Request, _res: Response, next: (err: unknown) => void) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

export default notFound;

