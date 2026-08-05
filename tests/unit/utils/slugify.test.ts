import { slugify } from '../../../src/utils/slugify';

describe('slugify', () => {
  it('lowercases and trims', () => {
    expect(slugify('  Sony Camera  ')).toBe('sony-camera');
  });

  it('replaces spaces with hyphens', () => {
    expect(slugify('Sony A7 III Mirrorless Camera')).toBe('sony-a7-iii-mirrorless-camera');
  });

  it('removes special characters', () => {
    expect(slugify('MacBook Pro 16" M2!')).toBe('macbook-pro-16-m2');
  });

  it('collapses multiple separators', () => {
    expect(slugify('a   b___c')).toBe('a-b-c');
  });

  it('strips leading and trailing hyphens', () => {
    expect(slugify('---hello---')).toBe('hello');
  });

  it('handles empty string', () => {
    expect(slugify('')).toBe('');
  });
});
