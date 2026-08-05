import dotenv from 'dotenv';

describe('setup check', () => {
  it('dotenv config is a function', () => {
    expect(typeof dotenv.config).toBe('function');
  });
});
