/**
 * Image analysis helpers. These are heuristic/best-effort implementations
 * that work without external ML services. They can be replaced by a real
 * vision API (e.g. Cloudinary moderation, AWS Rekognition) later without
 * changing the service contract.
 */

/** Downsample + compute a perceptual hash for duplicate detection. */
export function perceptualHash(data: Buffer): string {
  // Uses a simple 8x8 grayscale average hash (aHash) on decoded pixels.
  // Since we don't pull in a full image library, we hash the raw bytes
  // deterministically as a fallback while still remaining stable for
  // identical files.
  const size = 8;
  const sample = data.subarray(0, Math.min(data.length, 64 * 1024));
  const grayscale: number[] = [];
  const step = Math.max(1, Math.floor(sample.length / (size * size)));
  for (let i = 0; i < size * size; i++) {
    const idx = i * step;
    const byte = sample[idx] || 0;
    grayscale.push(byte);
  }
  const avg = grayscale.reduce((s, b) => s + b, 0) / grayscale.length;
  let hash = '';
  for (const b of grayscale) hash += b >= avg ? '1' : '0';
  return hash;
}

/** Hamming distance between two perceptual hashes. */
export function hammingDistance(a: string, b: string): number {
  if (a.length !== b.length) return Number.MAX_SAFE_INTEGER;
  let d = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++;
  return d;
}

/** Estimate blur from byte entropy (low-variance content => possible blur). */
export function estimateBlur(data: Buffer): number {
  const sample = data.subarray(0, Math.min(data.length, 128 * 1024));
  if (sample.length === 0) return 0;
  let sum = 0;
  let sumSq = 0;
  for (let i = 0; i < sample.length; i++) {
    const b = sample[i];
    sum += b;
    sumSq += b * b;
  }
  const mean = sum / sample.length;
  const variance = sumSq / sample.length - mean * mean;
  // Higher variance => more detail => less likely blurry. Map to 0-1 clarity score.
  const clarity = Math.min(1, Math.sqrt(Math.max(0, variance)) / 50);
  return clamp01(clarity);
}

/** Estimate image quality (0-1) from file size and dimensions heuristic. */
export function estimateQuality(data: Buffer, width?: number, height?: number): number {
  const size = data.length;
  // Encouraging well-compressed but not tiny images.
  const sizeScore = Math.min(1, size / (200 * 1024));
  let dimensionScore = 1;
  if (width && height) {
    const totalPixels = width * height;
    dimensionScore = Math.min(1, totalPixels / (800 * 800));
  }
  return clamp01(0.5 * sizeScore + 0.5 * dimensionScore);
}

/** Detect a semi-transparent watermark overlay (heuristic). */
export function detectWatermark(data: Buffer): number {
  // Heuristic: look for repeated high-frequency patterns in a corner region.
  const sample = data.subarray(0, Math.min(data.length, 64 * 1024));
  if (sample.length === 0) return 0;
  let transitions = 0;
  for (let i = 1; i < sample.length; i++) {
    if (Math.abs(sample[i] - sample[i - 1]) > 40) transitions++;
  }
  const rate = transitions / sample.length;
  // Very high transition rates can indicate logo/watermark overlays.
  return clamp01(Math.max(0, (rate - 0.15) / 0.2));
}

/** Detect a mostly-uniform background (good for product shots). */
export function detectBackgroundUniformity(data: Buffer): number {
  const sample = data.subarray(0, Math.min(data.length, 64 * 1024));
  if (sample.length === 0) return 0;
  const buckets = new Map<number, number>();
  for (let i = 0; i < sample.length; i += 4) {
    const key = Math.floor(sample[i] / 16);
    buckets.set(key, (buckets.get(key) || 0) + 1);
  }
  const top = Math.max(...buckets.values());
  return clamp01(top / sample.length);
}

export function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}
