import { z } from 'zod';
import { validate } from '../../../src/middleware/validate';

describe('validate middleware', () => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
  });

  it('passes valid body to next', () => {
    const next = vi.fn();
    const req = { body: { email: 'a@b.com', password: 'password1' } } as any;
    validate({ body: schema })(req, {} as any, next);
    expect(next).toHaveBeenCalledWith();
    expect(req.body.email).toBe('a@b.com');
  });

  it('rejects invalid body with 422', () => {
    const next = vi.fn();
    const req = { body: { email: 'notemail', password: 'short' } } as any;
    validate({ body: schema })(req, {} as any, next);
    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(422);
    expect(err.errors).toBeDefined();
  });

  it('validates params', () => {
    const next = vi.fn();
    const paramsSchema = z.object({ id: z.string().min(1) });
    const req = { params: { id: 'abc' }, body: {} } as any;
    validate({ params: paramsSchema })(req, {} as any, next);
    expect(next).toHaveBeenCalledWith();
    expect(req.params.id).toBe('abc');
  });

  it('validates query', () => {
    const next = vi.fn();
    const querySchema = z.object({ page: z.coerce.number() });
    const req = { query: { page: '2' }, body: {} } as any;
    validate({ query: querySchema })(req, {} as any, next);
    expect(next).toHaveBeenCalledWith();
    expect(req.query.page).toBe(2);
  });

  it('calls next without validation when no schemas', () => {
    const next = vi.fn();
    validate({})({ body: {} } as any, {} as any, next);
    expect(next).toHaveBeenCalledWith();
  });
});
