// ImageAnalysisService unit tests — mocks the AI image utils

vi.mock('../../../../src/utils/ai/image', () => ({
  perceptualHash: vi.fn(() => 'hash123'),
  hammingDistance: vi.fn(() => 0),
  estimateBlur: vi.fn(() => 0.8),
  estimateQuality: vi.fn(() => 0.9),
  detectWatermark: vi.fn(() => 0.1),
  detectBackgroundUniformity: vi.fn(() => 0.9),
  clamp01: (n: number) => Math.max(0, Math.min(1, n)),
}));

vi.mock('../../../../src/utils/ai/text', () => ({
  detectCategory: vi.fn(() => 'camera'),
}));

import ImageAnalysisService from '../../../../src/services/ai/image.service';
import { estimateBlur, estimateQuality, detectWatermark, detectBackgroundUniformity, perceptualHash, hammingDistance } from '../../../../src/utils/ai/image';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ImageAnalysisService', () => {
  describe('analyzeImages', () => {
    it('analyzes a single image', async () => {
      const result = await ImageAnalysisService.analyzeImages([
        { buffer: Buffer.from('test'), width: 100, height: 100, filename: 'camera.jpg' },
      ]);
      expect(result.images).toHaveLength(1);
      expect(result.images[0].detectedObjectCategory).toBe('camera');
      expect(result.images[0].overallScore).toBeGreaterThan(0);
      expect(result.summary).toBeDefined();
    });

    it('analyzes multiple images and detects duplicates', async () => {
      (perceptualHash as any).mockReturnValue('hashA');
      (hammingDistance as any).mockReturnValue(1);
      const result = await ImageAnalysisService.analyzeImages([
        { buffer: Buffer.from('a'), filename: 'a.jpg' },
        { buffer: Buffer.from('b'), filename: 'b.jpg' },
      ]);
      expect(result.images).toHaveLength(2);
      expect(result.images[0].isDuplicate).toBe(true);
    });

    it('returns zero score for empty input', async () => {
      const result = await ImageAnalysisService.analyzeImages([]);
      expect(result.images).toHaveLength(0);
      expect(result.overallScore).toBe(0);
    });
  });
});
