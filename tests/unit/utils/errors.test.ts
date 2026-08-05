import ApiError from '../../../src/utils/ApiError';
import ApiResponse from '../../../src/utils/ApiResponse';

describe('ApiError', () => {
  it('creates an error with statusCode and message', () => {
    const err = new ApiError(404, 'Not found');
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe('Not found');
    expect(err.isOperational).toBe(true);
  });

  it('attaches field errors', () => {
    const errors = { email: ['Email is required'] };
    const err = new ApiError(422, 'Validation failed', errors);
    expect(err.errors).toEqual(errors);
  });

  it('is an instance of Error', () => {
    const err = new ApiError(500, 'boom');
    expect(err).toBeInstanceOf(Error);
  });
});

describe('ApiResponse', () => {
  it('creates a success envelope', () => {
    const res = ApiResponse.ok({ id: 1 }, 'Created');
    expect(res.success).toBe(true);
    expect(res.data).toEqual({ id: 1 });
    expect(res.message).toBe('Created');
  });

  it('works without message', () => {
    const res = ApiResponse.ok<null>(null);
    expect(res.success).toBe(true);
    expect(res.data).toBeNull();
    expect(res.message).toBeUndefined();
  });

  it('supports new keyword', () => {
    const res = new ApiResponse([1, 2, 3]);
    expect(res.success).toBe(true);
    expect(res.data).toEqual([1, 2, 3]);
  });
});
