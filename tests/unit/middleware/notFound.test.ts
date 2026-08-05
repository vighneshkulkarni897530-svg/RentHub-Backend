import { notFound } from '../../../src/middleware/notFound';

describe('notFound', () => {
  it('calls next with a 404 ApiError', () => {
    const next = vi.fn();
    const req = { method: 'GET', originalUrl: '/api/v1/nope' } as any;
    notFound(req, {} as any, next);
    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(404);
    expect(err.message).toContain('GET /api/v1/nope');
  });
});
