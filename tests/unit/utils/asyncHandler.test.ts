import { asyncHandler } from '../../../src/utils/asyncHandler';

describe('asyncHandler', () => {
  it('calls next when the handler rejects', async () => {
    const next = vi.fn();
    const handler = asyncHandler(async () => {
      throw new Error('boom');
    });
    const req = {} as any;
    const res = {} as any;
    await handler(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('calls the handler and resolves on success', async () => {
    const next = vi.fn();
    const fn = vi.fn().mockResolvedValue('ok');
    const handler = asyncHandler(fn);
    const req = { body: {} } as any;
    const res = { json: vi.fn() } as any;
    await handler(req, res, next);
    expect(fn).toHaveBeenCalledWith(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });

  it('propagates custom ApiError to next', async () => {
    const next = vi.fn();
    const handler = asyncHandler(async () => {
      const err = new Error('denied') as Error & { statusCode: number };
      err.statusCode = 403;
      throw err;
    });
    await handler({} as any, {} as any, next);
    const passed = next.mock.calls[0][0];
    expect(passed.statusCode).toBe(403);
  });
});
