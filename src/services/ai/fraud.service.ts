import FraudAlertRepository from '../../repositories/FraudAlertRepository';
import UserRepository from '../../repositories/UserRepository';
import ProductRepository from '../../repositories/ProductRepository';
import BookingRepository from '../../repositories/BookingRepository';
import ReviewRepository from '../../repositories/ReviewRepository';
import { normalize } from '../../utils/ai/text';

/**
 * Fraud Detection service.
 * Detects fake users, spam listings, duplicate products, suspicious bookings,
 * fake reviews, and multiple accounts. Produces a risk score and alerts.
 */
export class FraudService {
  /**
   * Compute a risk score (0-100) for a user.
   */
  async scoreUser(userId: string): Promise<{ score: number; signals: string[] }> {
    const user = await UserRepository.findById(userId);
    if (!user) return { score: 0, signals: [] };
    const signals: string[] = [];
    let score = 0;

// New account + no verification.
    const created = (user as any).createdAt || user.lastActive || Date.now();
    const ageDays = (Date.now() - new Date(created).getTime()) / 86400000;
    if (ageDays < 7) {
      score += 15;
      signals.push('New account created recently');
    }
    if (!user.verified && !user.isEmailVerified) {
      score += 10;
      signals.push('Email not verified');
    }
    // No avatar / empty name pattern.
    if (user.name && /^[a-z0-9_]{1,6}$/i.test(user.name)) {
      score += 10;
      signals.push('Suspicious short username');
    }
    // Temp email domains.
    if (user.email && /(temp|throwaway|disposable|mailinator|guerrilla|10minute)/i.test(user.email)) {
      score += 30;
      signals.push('Disposable email domain');
    }

    // Multiple accounts: same phone/name.
    const dupCount = await this.countSimilarAccounts(userId, user);
    if (dupCount > 0) {
      score += 20;
      signals.push(`${dupCount} similar account(s) found`);
    }

    return { score: Math.min(100, score), signals };
  }

  /**
   * Evaluate a product listing for spam/duplicate signals.
   */
  async scoreProduct(productId: string): Promise<{ score: number; signals: string[]; duplicateOf?: string }> {
    const product = await ProductRepository.findById(productId);
    if (!product) return { score: 0, signals: [] };
    const signals: string[] = [];
    let score = 0;

    // Duplicate detection by title similarity.
    const dup = await this.findDuplicateProduct(product);
    if (dup) {
      score += 40;
      signals.push('Possible duplicate listing');
      // Return the duplicate id in the result.
    }

    // Title all-caps / promotional spam.
    if (product.title && product.title === product.title.toUpperCase() && product.title.length > 10) {
      score += 15;
      signals.push('All-caps title (possible spam)');
    }
    // Excessive exclamation marks.
    if (product.description && /!{3,}/.test(product.description)) {
      score += 10;
      signals.push('Excessive exclamation marks');
    }
    // Suspiciously low price.
    if (product.rentalPrice > 0 && product.rentalPrice < 5) {
      score += 10;
      signals.push('Suspiciously low rental price');
    }
    // No images.
    if (!product.images || product.images.length === 0) {
      score += 20;
      signals.push('No product images');
    }

    return { score: Math.min(100, score), signals, duplicateOf: dup ? String(dup._id) : undefined };
  }

  /**
   * Evaluate a booking for suspicious patterns.
   */
  async scoreBooking(bookingId: string): Promise<{ score: number; signals: string[] }> {
    const booking = await BookingRepository.findById(bookingId);
    if (!booking) return { score: 0, signals: [] };
    const signals: string[] = [];
    let score = 0;

    const start = new Date(booking.startDate).getTime();
    const now = Date.now();
    // Same-day rush booking.
    if (start - now < 60 * 60 * 1000) {
      score += 20;
      signals.push('Booking within 1 hour of start');
    }
    // Very long duration.
    const durationDays = Math.max(1, Math.round((new Date(booking.endDate).getTime() - start) / 86400000));
    if (durationDays > 60) {
      score += 25;
      signals.push('Unusually long rental duration');
    }
    // Zero total price.
    if (!booking.totalPrice || booking.totalPrice <= 0) {
      score += 20;
      signals.push('Zero booking total');
    }
    // Repeated bookings by same renter on same product pending.
    const repeat = await BookingRepository.countDocuments({
      renter: booking.renter as any,
      product: booking.product as any,
      status: 'pending',
    });
    if (repeat > 3) {
      score += 25;
      signals.push('Multiple pending bookings for same product');
    }

    return { score: Math.min(100, score), signals };
  }

  /**
   * Evaluate a review for fake signals.
   */
  async scoreReview(reviewId: string): Promise<{ score: number; signals: string[] }> {
    const review = await ReviewRepository.findById(reviewId);
    if (!review) return { score: 0, signals: [] };
    const signals: string[] = [];
    let score = 0;

    // All 5-star with no text.
    if (review.rating === 5 && (!review.comment || review.comment.trim().length < 10)) {
      score += 25;
      signals.push('5-star review with no detail');
    }
    // Generic/spammy text.
    if (review.comment && /(great|awesome|best|good|nice|recommend|love|perfect|excellent)/i.test(review.comment) && review.comment.length < 40) {
      score += 15;
      signals.push('Generic short review text');
    }
    // Multiple reviews by same user on same product.
    const repeat = await ReviewRepository.countDocuments({
      user: review.user as any,
      product: review.product as any,
    });
    if (repeat > 1) {
      score += 20;
      signals.push('Multiple reviews by same user');
    }

    return { score: Math.min(100, score), signals };
  }

  /**
   * Run a full scan and create fraud alerts for high-risk targets.
   */
  async scanAndCreateAlerts(options: { limit?: number } = {}) {
    const limit = options.limit || 20;
    const alerts: any[] = [];

    // 1. Scan users.
    const users = await UserRepository.find({}, { limit });
    for (const user of users as any[]) {
      const r = await this.scoreUser(String(user._id));
      if (r.score >= 50) {
        alerts.push(
          await FraudAlertRepository.createAlert({
            type: 'fake_user',
            severity: this.severity(r.score),
            riskScore: r.score,
            title: `Suspicious user: ${user.name}`,
            description: r.signals.join('; '),
            targetType: 'user',
            targetId: user._id,
            actorId: user._id,
            evidence: { signals: r.signals },
            suggestedAction: 'Review account for verification and possible suspension.',
          })
        );
      }
    }

    // 2. Scan products.
    const products = await ProductRepository.find({}, { limit });
    for (const product of products as any[]) {
      const r = await this.scoreProduct(String(product._id));
      if (r.score >= 50) {
        alerts.push(
          await FraudAlertRepository.createAlert({
            type: 'duplicate_product',
            severity: this.severity(r.score),
            riskScore: r.score,
            title: `Suspicious listing: ${product.title}`,
            description: r.signals.join('; '),
            targetType: 'product',
            targetId: product._id,
            actorId: product.owner,
            evidence: { signals: r.signals, duplicateOf: r.duplicateOf },
            suggestedAction: 'Review listing for spam or duplicate content.',
          })
        );
      }
    }

    return alerts;
  }

  async listAlerts(options: { status?: string; limit?: number; skip?: number } = {}) {
    return FraudAlertRepository.listAll(options as any);
  }

  async updateAlertStatus(id: string, status: string, resolvedBy?: string) {
    return FraudAlertRepository.updateStatus(id, status as any, resolvedBy);
  }

  private severity(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'critical';
    if (score >= 65) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  }

  private async countSimilarAccounts(userId: string, user: any): Promise<number> {
    const or: Record<string, unknown>[] = [];
    if (user.phone) or.push({ phone: user.phone, _id: { $ne: userId } });
    if (user.name) or.push({ name: user.name, _id: { $ne: userId } });
    if (or.length === 0) return 0;
    return UserRepository.countDocuments({ $or: or } as any);
  }

  private async findDuplicateProduct(product: any): Promise<any | null> {
    const normalized = normalize(product.title || '');
    if (!normalized) return null;
    const candidates = await ProductRepository.find({
      title: { $regex: normalized.slice(0, 20), $options: 'i' },
      _id: { $ne: product._id },
    });
    for (const c of candidates as any[]) {
      if (normalize(c.title || '') === normalized) {
        return c;
      }
    }
    return null;
  }
}

export default new FraudService();
