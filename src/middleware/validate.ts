import { NextFunction, Request, Response } from 'express';
import { ZodType, ZodError } from 'zod';
import ApiError from '../utils/ApiError';

/**
 * Validates request data against a Zod schema.
 * Supports validation of body, params, and query.
 *
 * Usage: validate({ body: loginSchema, params: idSchema })
 */
export const validate =
  (schemas: { body?: ZodType; params?: ZodType; query?: ZodType }) =>
  (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        const result = schemas.body.safeParse(req.body);
        if (!result.success) {
          const errors = formatZodErrors(result.error);
          throw new ApiError(422, 'Validation failed', errors);
        }
        req.body = result.data;
      }
      if (schemas.params) {
        const result = schemas.params.safeParse(req.params);
        if (!result.success) {
          const errors = formatZodErrors(result.error);
          throw new ApiError(422, 'Invalid parameters', errors);
        }
        req.params = result.data as Record<string, string>;
      }
      if (schemas.query) {
        const result = schemas.query.safeParse(req.query);
        if (!result.success) {
          const errors = formatZodErrors(result.error);
          throw new ApiError(422, 'Invalid query parameters', errors);
        }
        req.query = result.data as Record<string, any>;
      }
      return next();
    } catch (error) {
      return next(error);
    }
  };

function formatZodErrors(error: ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'form';
    if (!errors[key]) errors[key] = [];
    errors[key].push(issue.message);
  }
  return errors;
}

export default validate;

