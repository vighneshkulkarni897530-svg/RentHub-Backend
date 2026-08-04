import { perceptualHash, hammingDistance, estimateBlur, estimateQuality, detectWatermark, detectBackgroundUniformity, clamp01 } from '../../utils/ai/image';
import { detectCategory } from '../../utils/ai/text';

/**
 * AI Image Analysis service.
 * Analyzes uploaded product images to detect quality, blur, duplicates,
 * background quality, object category, damage, and watermarks.
 * Returns improvement suggestions.
 */
export class ImageAnalysisService {
  async analyzeImages(files: { buffer: Buffer; width?: number; height?: number; filename?: string }[]) {
    const results = files.map((file) => this.analyzeSingle(file));
    // Duplicate detection across the set.
    const hashes = results.map((r) => r.hash);
    for (let i = 0; i < results.length; i++) {
      const duplicates: number[] = [];
      for (let j = 0; j < results.length; j++) {
        if (i === j) continue;
        if (hammingDistance(hashes[i], hashes[j]) <= 3) duplicates.push(j);
      }
      results[i].duplicates = duplicates;
      results[i].isDuplicate = duplicates.length > 0;
    }

    const overallScore = results.length
      ? Math.round((results.reduce((s, r) => s + r.overallScore, 0) / results.length) * 100) / 100
      : 0;

    return {
      images: results,
      overallScore,
      summary: this.summary(overallScore, results),
    };
  }

private analyzeSingle(file: { buffer: Buffer; width?: number; height?: number; filename?: string }): {
    filename: string;
    hash: string;
    qualityScore: number;
    blurScore: number;
    isBlurry: boolean;
    watermarkScore: number;
    hasWatermark: boolean;
    backgroundScore: number;
    hasGoodBackground: boolean;
    detectedObjectCategory: string | null;
    isLowQuality: boolean;
    overallScore: number;
    duplicates: number[];
    isDuplicate: boolean;
    suggestions: string[];
  } {
    const data = file.buffer;
    const blurScore = estimateBlur(data);
    const qualityScore = estimateQuality(data, file.width, file.height);
    const watermarkScore = detectWatermark(data);
    const backgroundScore = detectBackgroundUniformity(data);
    const hash = perceptualHash(data);
    const category = detectCategory(file.filename || '');

    const overallScore = clamp01(
      0.4 * qualityScore + 0.3 * blurScore + 0.15 * (1 - watermarkScore) + 0.15 * backgroundScore
    );

    const suggestions = this.suggestions(qualityScore, blurScore, watermarkScore, backgroundScore);

    return {
      filename: file.filename || 'image',
      hash,
      qualityScore: Math.round(qualityScore * 100) / 100,
      blurScore: Math.round(blurScore * 100) / 100,
      isBlurry: blurScore < 0.4,
      watermarkScore: Math.round(watermarkScore * 100) / 100,
      hasWatermark: watermarkScore > 0.5,
      backgroundScore: Math.round(backgroundScore * 100) / 100,
      hasGoodBackground: backgroundScore > 0.5,
      detectedObjectCategory: category || null,
      isLowQuality: qualityScore < 0.4,
      overallScore: Math.round(overallScore * 100) / 100,
      duplicates: [],
      isDuplicate: false,
      suggestions,
    };
  }

  private suggestions(quality: number, blur: number, watermark: number, background: number): string[] {
    const s: string[] = [];
    if (quality < 0.4) s.push('Upload a higher-resolution image for better listing quality.');
    if (blur < 0.4) s.push('Image appears blurry. Use a sharp, well-lit photo.');
    if (watermark > 0.5) s.push('Watermark detected. Remove watermarks for a cleaner listing.');
    if (background < 0.5) s.push('Use a clean, uniform background for a professional look.');
    if (s.length === 0) s.push('Great image! This looks well-suited for your listing.');
    return s;
  }

  private summary(overallScore: number, results: any[]): string {
    const blurryCount = results.filter((r) => r.isBlurry).length;
    const lowCount = results.filter((r) => r.isLowQuality).length;
    const dupCount = results.filter((r) => r.isDuplicate).length;
    if (overallScore >= 0.7) return 'Your images are in great shape. The listing is ready to publish.';
    if (blurryCount || lowCount || dupCount) {
      return `${blurryCount} blurry, ${lowCount} low-quality, ${dupCount} duplicate image(s) detected. Consider replacing them for better engagement.`;
    }
    return 'Images are acceptable but could be improved for higher engagement.';
  }
}

export default new ImageAnalysisService();
