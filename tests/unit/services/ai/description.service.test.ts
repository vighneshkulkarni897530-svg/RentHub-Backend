// DescriptionService unit tests — pure function, no mocks needed

import DescriptionService from '../../../../src/services/ai/description.service';

describe('DescriptionService', () => {
  describe('generate', () => {
    it('generates a full product description', () => {
      const result = DescriptionService.generate({
        title: 'Canon DSLR Camera',
        category: 'cameras',
        brand: 'Canon',
        condition: 'good',
        features: ['4K video', 'Stabilisation'],
      });
      expect(result.title).toBe('Canon DSLR Camera');
      expect(result.description).toContain('camera');
      expect(result.features).toContain('4K video');
      expect(result.specifications).toBeDefined();
      expect(result.seoKeywords.length).toBeGreaterThan(0);
      expect(result.metaDescription).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('generates a title when none provided', () => {
      const result = DescriptionService.generate({ category: 'cameras', brand: 'Canon', condition: 'new' });
      expect(result.title).toContain('Canon');
      expect(result.title.toLowerCase()).toContain('camera');
    });

    it('generates default features when none provided', () => {
      const result = DescriptionService.generate({ category: 'cameras' });
      expect(result.features.length).toBeGreaterThan(0);
    });

    it('uses brand in keywords', () => {
      const result = DescriptionService.generate({ category: 'cameras', brand: 'Sony' });
      expect(result.seoKeywords).toContain('sony');
    });
  });

  describe('conditionLabel', () => {
    it('maps conditions', () => {
      // Access via generated description
      const used = DescriptionService.generate({ category: 'cameras', condition: 'used' });
      expect(used.description.toLowerCase()).toContain('gently used');
    });
  });
});
