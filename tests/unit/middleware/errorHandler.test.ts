import mongoose from 'mongoose';
import { errorHandler } from '../../../src/middleware/errorHandler';
import ApiError from '../../../src/utils/ApiError';

describe('errorHandler', () => {
  function makeRes() {
    const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    return res;
  }

  it('handles ApiError', () => {
    const res = makeRes();
    errorHandler(new ApiError(404, 'Not found'), {} as any, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Not found',
      statusCode: 404,
    });
  });

  it('handles Mongoose validation error', () => {
    const res = makeRes();
    const err = new mongoose.Error.ValidationError();
    err.errors = { email: { message: 'Email is required' } as any };
    errorHandler(err, {} as any, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    const body = res.json.mock.calls[0][0];
    expect(body.errors.email).toEqual(['Email is required']);
  });

  it('handles duplicate key error (11000)', () => {
    const res = makeRes();
    const err = { code: 11000, keyValue: { email: 'a@b.com' } };
    errorHandler(err as any, {} as any, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json.mock.calls[0][0].message).toContain('email already exists');
  });

  it('handles generic errors as 500', () => {
    const res = makeRes();
    errorHandler(new Error('boom'), {} as any, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0].message).toBe('Internal server error');
  });

  it('handles JWT errors', () => {
    const res = makeRes();
    const err = new Error('jwt malformed');
    err.name = 'JsonWebTokenError';
    errorHandler(err as any, {} as any, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
