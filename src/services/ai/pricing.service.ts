import ProductRepository from '../../repositories/ProductRepository';
import BookingRepository from '../../repositories/BookingRepository';
import AIInsightRepository from '../../repositories/AIInsightRepository';
import { clamp01 } from '../../utils/ai/image';

/**
 * AI Price Recommendation service.
 * Suggests rental prices for owners using category, brand, condition,
 * product age, demand, season, nearby competitors, and historical bookings.
 * Returns a confidence score.
 */
export class PricingService {
  async suggestPrice(input: {
    category?: string;
    brand?: string;
    condition?: string;
    age?: number;
    location?: string;
    city?: string;
    priceUnit?: string;
  }) {
    const cacheKey = `price:${input.category || ''}:${input.brand || ''}:${input.condition || ''}:${input.city || ''}:${input.priceUnit || 'day'}`;
    const cached = await AIInsightRepository.getCached('price_suggestion', 'user', undefined, undefined);
    if (cached && cached.data.key === cacheKey) {
      return cached.data;
    }

    const condition = input.condition || 'good';
    const priceUnit = input.priceUnit || 'day';
    const categoryId = input.category;

    // 1. Competitor prices (same category, same condition, active).
    const competitorFilter: Record<string, unknown> = {
      listingStatus: 'active',
      moderationStatus: 'approved',
      priceUnit,
    };
    if (categoryId) competitorFilter.category = categoryId;
    if (input.city) competitorFilter['location.city'] = input.city;

    const competitors = await ProductRepository.find(competitorFilter as any, {
      select: 'rentalPrice condition rentalPrice bookingsCount rating',
    });

    const prices = (competitors as any[]).map((p) => p.rentalPrice).filter((n: number) => n > 0);
    const avgCompetitor = prices.length
      ? prices.reduce((s: number, n: number) => s + n, 0) / prices.length
      : 0;

    // 2. Condition-based adjustment.
    const conditionMultiplier: Record<string, number> = {
      new: 1.15,
      like_new: 1.05,
      good: 1.0,
      fair: 0.85,
      used: 0.75,
    };
    const condFactor = conditionMultiplier[condition] || 1.0;

    // 3. Age-based depreciation (if age provided, in years).
    const age = input.age || 0;
    const ageFactor = Math.max(0.5, 1 - age * 0.05);

    // 4. Demand factor from bookings count.
    const demandBuckets = (competitors as any[]).map((p) => p.bookingsCount || 0);
    const avgDemand = demandBuckets.length
      ? demandBuckets.reduce((s: number, n: number) => s + n, 0) / demandBuckets.length
      : 0;
    const demandFactor = clamp01(1 + avgDemand / 50);

    // 5. Season factor (peak rental seasons).
    const seasonFactor = this.seasonFactor();

    // 6. Brand premium (rough heuristic).
    const brandFactor = this.brandFactor(input.brand);

    // 7. Base price estimate.
    const basePrice = avgCompetitor || 50;
    let suggested = basePrice * condFactor * ageFactor * demandFactor * seasonFactor * brandFactor;

    // Round to sensible value.
    suggested = this.roundPrice(suggested);

    // 8. Confidence score: more data => higher confidence.
    const confidence = clamp01(
      (prices.length / 20) * 0.5 + (categoryId ? 0.2 : 0) + (avgCompetitor > 0 ? 0.2 : 0) + 0.1
    );

    const result = {
      key: cacheKey,
      suggestedPrice: suggested,
      priceUnit,
      range: {
        min: this.roundPrice(suggested * 0.85),
        max: this.roundPrice(suggested * 1.2),
      },
      avgCompetitorPrice: Math.round(avgCompetitor),
      competitorCount: prices.length,
      conditionFactor: condFactor,
      ageFactor,
      demandFactor,
      seasonFactor,
      brandFactor,
      confidence: Math.round(confidence * 100) / 100,
      factors: {
        condition,
        age: age || null,
        demand: avgDemand.toFixed(1),
        season: this.seasonName(),
      },
    };

    await AIInsightRepository.cache({
      type: 'price_suggestion',
      scope: 'user',
      data: result,
      confidence,
      expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
    });

    return result;
  }

  private seasonFactor(): number {
    const month = new Date().getMonth();
    // Rental peak: Nov-Feb (holidays), Apr-Jun (weddings/summer).
    if (month >= 10 || month <= 1) return 1.15;
    if (month >= 3 && month <= 5) return 1.1;
    return 1.0;
  }

  private seasonName(): string {
    const month = new Date().getMonth();
    if (month >= 10 || month <= 1) return 'peak (holiday)';
    if (month >= 3 && month <= 5) return 'high (wedding/summer)';
    return 'regular';
  }

  private brandFactor(brand?: string): number {
    if (!brand) return 1;
    const premium = ['sony', 'canon', 'nikon', 'apple', 'macbook', 'bose', 'dyson', 'gopro', 'trek', 'dewalt', 'milwaukee', 'leica', 'fujifilm'];
    const b = brand.toLowerCase();
    if (premium.some((p) => b.includes(p))) return 1.12;
    return 1.0;
  }

  private roundPrice(n: number): number {
    if (n <= 0) return 0;
    if (n < 100) return Math.round(n);
    if (n < 1000) return Math.round(n / 5) * 5;
    return Math.round(n / 50) * 50;
  }
}

export default new PricingService();
