import {
  perceptualHash,
  hammingDistance,
  estimateBlur,
  estimateQuality,
  detectWatermark,
  detectBackgroundUniformity,
  clamp01,
} from '../../../src/utils/ai/image';

describe('ai/image utils', () => {
  describe('perceptualHash', () => {
    it('produces a stable 64-char hash', () => {
      const data = Buffer.from('some image bytes');
      const hash = perceptualHash(data);
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[01]+$/);
    });
    it('is deterministic for identical data', () => {
      const data = Buffer.from('same bytes');
      expect(perceptualHash(data)).toBe(perceptualHash(data));
    });
  });

  describe('hammingDistance', () => {
    it('counts differing bits', () => {
      expect(hammingDistance('0000', '0011')).toBe(2);
    });
    it('returns MAX_SAFE_INTEGER for different lengths', () => {
      expect(hammingDistance('000', '0000')).toBe(Number.MAX_SAFE_INTEGER);
    });
  });

  describe('estimateBlur', () => {
    it('returns 0 for empty data', () => {
      expect(estimateBlur(Buffer.alloc(0))).toBe(0);
    });
    it('returns a clamped clarity value', () => {
      const data = Buffer.from('some content with variance data');
      const clarity = estimateBlur(data);
      expect(clarity).toBeGreaterThanOrEqual(0);
      expect(clarity).toBeLessThanOrEqual(1);
    });
  });

  describe('estimateQuality', () => {
    it('scales with size and dimensions', () => {
      const big = Buffer.alloc(500 * 1024);
      const quality = estimateQuality(big, 1200, 1200);
      expect(quality).toBeGreaterThanOrEqual(0);
      expect(quality).toBeLessThanOrEqual(1);
    });
  });

  describe('detectWatermark', () => {
    it('returns 0 for empty data', () => {
      expect(detectWatermark(Buffer.alloc(0))).toBe(0);
    });
    it('returns clamped value', () => {
      const data = Buffer.from('a'.repeat(1000));
      expect(detectWatermark(data)).toBeGreaterThanOrEqual(0);
    });
  });

  describe('detectBackgroundUniformity', () => {
    it('returns 0 for empty data', () => {
      expect(detectBackgroundUniformity(Buffer.alloc(0))).toBe(0);
    });
    it('returns high uniformity for constant data', () => {
      expect(detectBackgroundUniformity(Buffer.alloc(1024, 200))).toBeGreaterThan(0.5);
    });
  });

  describe('clamp01', () => {
    it('clamps to [0,1]', () => {
      expect(clamp01(-1)).toBe(0);
      expect(clamp01(2)).toBe(1);
      expect(clamp01(0.5)).toBe(0.5);
    });
  });
});
