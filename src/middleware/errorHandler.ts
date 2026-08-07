import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import ApiError from '../utils/ApiError';
import logger from '../config/logger';

type ErrorWithContext = Error & {
  statusCode?: number;
  code?: number;
  path?: string;
  value?: any;
  keyValue?: Record<string, any>;
  errors?: Record<string, { message: string }>;
};

/**
 * Centralized error handling middleware.
 * Formats Mongoose errors and unexpected errors into a consistent
 * { success, message, errors, statusCode } envelope.
 */
export const errorHandler = (err: ErrorWithContext, req: Request, res: Response, _next: NextFunction) => {
  let error = err;

  if (error instanceof mongoose.Error.ValidationError) {
    const errors: Record<string, string[]> = {};
    Object.keys(error.errors).forEach((key) => {
      errors[key] = [error.errors[key].message];
    });
    error = new ApiError(400, 'Validation error', errors);
  } else if (error instanceof mongoose.Error.CastError) {
    error = new ApiError(400, `Invalid ${error.path}: ${error.value}`);
  } else if (error.code === 11000) {
    const field = Object.keys(error.keyValue || {})[0] || 'field';
    error = new ApiError(409, `${field} already exists`);
  } else if (error.name === 'JsonWebTokenError') {
    error = new ApiError(401, 'Invalid token. Please log in again.');
  } else if (error.name === 'TokenExpiredError') {
    error = new ApiError(401, 'Token expired. Please log in again.');
  } else if (!(error instanceof ApiError)) {
    logger.error(`Unhandled error: ${error.message || String(error)}`);
    error = new ApiError(500, 'Internal server error');
  }

  const statusCode = error.statusCode || 500;
  const response: Record<string, unknown> = {
    success: false,
    message: error.message || 'Something went wrong',
    statusCode,
  };
  if (error.errors) response.errors = error.errors;

  if (statusCode >= 500) {
    const requestId = (req as any).requestId || 'N/A';
    logger.error(`[${statusCode}] [requestId: ${requestId}] ${error.message}`, { stack: error.stack });
  }

  res.status(statusCode).json(response);
};

export default errorHandler;
