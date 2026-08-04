/**
 * Custom API error class with status code and optional field errors.
 */
export class ApiError extends Error {
  public statusCode: number;
  public errors?: Record<string, string[]>;
  public isOperational: boolean;

  constructor(
    statusCode: number,
    message: string,
    errors?: Record<string, string[]>,
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ApiError;

