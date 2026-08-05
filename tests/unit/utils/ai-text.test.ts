import {
  normalize,
  tokenize,
  stem,
  analyze,
  termFrequency,
  cosineSimilarity,
  editDistance,
  extractPriceRange,
  detectCategory,
} from '../../../src/utils/ai/text';

describe('ai/text utils', () => {
  describe('normalize', () => {
    it('lowercases and trims', () => {
      expect(normalize('  Sony Camera  ')).toBe('sony camera');
    });
    it('collapses whitespace', () => {
      expect(normalize('a    b')).toBe('a b');
    });
  });

  describe('tokenize', () => {
    it('splits into word tokens and removes stopwords', () => {
      const tokens = tokenize('Rent a camera for the event');
      expect(tokens).toContain('camera');
      expect(tokens).toContain('event');
      expect(tokens).not.toContain('a');
      expect(tokens).not.toContain('the');
    });
    it('filters single-char tokens', () => {
      expect(tokenize('a b c x')).toEqual([]);
    });
  });

  describe('stem', () => {
    it('strips plural s', () => {
      expect(stem('cameras')).toBe('camera');
    });
    it('converts ies to y', () => {
      expect(stem('parties')).toBe('party');
    });
    it('strips ing', () => {
      expect(stem('renting')).toBe('rent');
    });
    it('keeps short words', () => {
      expect(stem('cat')).toBe('cat');
    });
  });

  describe('analyze', () => {
    it('tokenizes and stems', () => {
      const result = analyze('Renting cameras');
      expect(result).toContain('camera');
    });
  });

  describe('termFrequency', () => {
    it('counts token occurrences', () => {
      const tf = termFrequency(['camera', 'camera', 'lens']);
      expect(tf.get('camera')).toBe(2);
      expect(tf.get('lens')).toBe(1);
    });
  });

  describe('cosineSimilarity', () => {
    it('returns 1 for identical vectors', () => {
      const a = termFrequency(['camera', 'lens']);
expect(cosineSimilarity(a, termFrequency(['camera', 'lens']))).toBeCloseTo(1, 10);
    });
    it('returns 0 for disjoint vectors', () => {
      const a = termFrequency(['camera']);
      expect(cosineSimilarity(a, termFrequency(['drill']))).toBe(0);
    });
    it('returns 0 when a vector is empty', () => {
      expect(cosineSimilarity(new Map(), termFrequency(['x']))).toBe(0);
    });
  });

  describe('editDistance', () => {
    it('computes Levenshtein distance', () => {
      expect(editDistance('camera', 'cameras')).toBe(1);
      expect(editDistance('kitten', 'sitting')).toBe(3);
      expect(editDistance('same', 'same')).toBe(0);
    });
    it('handles empty strings', () => {
      expect(editDistance('', 'abc')).toBe(3);
      expect(editDistance('abc', '')).toBe(3);
    });
  });

  describe('extractPriceRange', () => {
    it('detects under/max', () => {
      expect(extractPriceRange('camera under 800')).toEqual({ max: 800 });
    });
    it('detects above/min', () => {
      expect(extractPriceRange('camera above 500')).toEqual({ min: 500 });
    });
    it('detects a range', () => {
      expect(extractPriceRange('500 to 1000')).toEqual({ min: 500, max: 1000 });
    });
    it('returns null when no price', () => {
      expect(extractPriceRange('just a camera')).toBeNull();
    });
  });

  describe('detectCategory', () => {
    it('detects cameras', () => {
      expect(detectCategory('Canon DSLR for rent')).toBe('cameras');
    });
    it('detects vehicles', () => {
      expect(detectCategory('rent a scooter')).toBe('vehicles');
    });
    it('returns null for unknown', () => {
      expect(detectCategory('random query thing')).toBeNull();
    });
  });
});
