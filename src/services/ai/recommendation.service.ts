import UserBehaviorRepository from '../../repositories/UserBehaviorRepository';
import WishlistRepository from '../../repositories/WishlistRepository';
import BookingRepository from '../../repositories/BookingRepository';
import ProductRepository from '../../repositories/ProductRepository';
import { analyze, termFrequency, cosineSimilarity } from '../../utils/ai/text';

/**
 * Recommendation Engine: hybrid content-based + collaborative filtering.
 * Uses browsing history, wishlist, bookings, location, category preference,
 * ratings, frequently-rented-together, and similar products.
 */
export class RecommendationService {
  async getRecommendations(userId: string, options: { limit?: number; exclude?: string[] } = {}) {
    const limit = options.limit || 12;
    const exclude = options.exclude || [];
    const excludeSet = new Set(exclude);

    // 1. Gather signals from user behavior.
    const viewedProductIds = await UserBehaviorRepository.recentProductIds(userId, 60);
    const preferredCategoryIds = await UserBehaviorRepository.preferredCategoryIds(userId, 5);

    // 2. Wishlist products.
    const wishlist = await WishlistRepository.findByUser(userId);
    const wishlistProductIds = (wishlist?.products || []).map((p: any) => String(p));

// 3. Booked products.
    const bookings = await BookingRepository.find({ renter: userId as any });
    const bookedProductIds = (bookings || []).map((b: any) => String(b.product?._id || b.product)).filter(Boolean);

    // 4. Build candidate pool.
    const candidateIds = new Set<string>([
      ...viewedProductIds,
      ...wishlistProductIds,
      ...bookedProductIds,
    ]);

    // 5. Collaborative: find similar users and their products.
    const similarUserIds = await UserBehaviorRepository.similarUsers(
      userId,
      Array.from(candidateIds).slice(0, 30),
      20
    );
    const collabProductIds = new Set<string>();
    for (const suid of similarUserIds) {
      const ids = await UserBehaviorRepository.recentProductIds(suid, 20);
      for (const id of ids) collabProductIds.add(id);
      for (const id of ids) candidateIds.add(id);
    }

    // 6. Frequently rented together: products co-occurring in same bookings.
    const togetherProducts = await this.frequentlyRentedTogether(
      Array.from(candidateIds).slice(0, 20),
      20
    );
    const togetherIds = togetherProducts.map((p: any) => String(p._id));
    for (const id of togetherIds) candidateIds.add(id);

    // 7. Load candidate products.
    const candidateList = await ProductRepository.find(
      {
        listingStatus: 'active',
        moderationStatus: 'approved',
        _id: { $in: Array.from(candidateIds) },
      },
      { populate: [{ path: 'category', select: 'name slug' }, { path: 'owner', select: 'name rating' }] }
    );

    // 8. Score candidates.
    const scored = (candidateList as any[]).map((product) => {
      let score = 0;
      const pid = String(product._id);
      // Preference match
      if (preferredCategoryIds.includes(String(product.category?._id || product.category))) score += 3;
      // Direct signals
      if (viewedProductIds.includes(pid)) score += 2;
      if (wishlistProductIds.includes(pid)) score += 4;
      if (bookedProductIds.includes(pid)) score += 3;
      if (collabProductIds.has(pid)) score += 1.5;
      if (togetherIds.includes(pid)) score += 1;
      // Rating signal
      score += (product.rating || 0) * 0.5;
      // Popularity
      score += Math.min(1, (product.bookingsCount || 0) / 20) * 2;
      return { product, score };
    });

// 9. Content-based similarity fallback for cold start.
    if (candidateList.length === 0) {
      const popular = await this.popularProducts(limit);
      const results = popular.filter((p) => !excludeSet.has(String(p._id))).slice(0, limit);
      return results.map((p) => ({ product: p, score: 1, reason: 'popular' }));
    }

    // 10. Content-based boost for viewed products.
    const queryTf = new Map<string, number>();
    for (const pid of viewedProductIds.slice(0, 5)) {
      const p = (candidateList as any[]).find((x) => String(x._id) === pid);
      if (p) {
        const tf = termFrequency(analyze(`${p.title} ${p.description} ${(p.tags || []).join(' ')}`));
        for (const [k, v] of tf) queryTf.set(k, (queryTf.get(k) || 0) + v);
      }
    }

    const final = scored.map(({ product, score }) => {
      const text = `${product.title} ${product.description} ${(product.tags || []).join(' ')}`;
      const sim = cosineSimilarity(queryTf, termFrequency(analyze(text)));
      return { product, score: score + sim * 2, reason: this.reasonFor(score, sim) };
    });

    final.sort((a, b) => b.score - a.score);
    return final
      .filter((r) => !excludeSet.has(String(r.product._id)))
      .slice(0, limit)
      .map((r) => ({ product: r.product, score: r.score, reason: r.reason }));
  }

  /** Products similar to a given product (content-based). */
  async similarProducts(productId: string, limit = 8) {
    const product = await ProductRepository.findByIdPopulated(productId);
    if (!product) return [];
    const productTf = termFrequency(analyze(`${product.title} ${product.description} ${(product.tags || []).join(' ')}`));
    const categoryId = product.category?._id || product.category;

    const candidates = await ProductRepository.find(
      {
        listingStatus: 'active',
        moderationStatus: 'approved',
        _id: { $ne: productId },
        ...(categoryId ? { category: categoryId } : {}),
      },
      { populate: [{ path: 'category', select: 'name slug' }, { path: 'owner', select: 'name rating' }], limit: 50 }
    );

    const scored = (candidates as any[]).map((c) => {
      const text = `${c.title} ${c.description} ${(c.tags || []).join(' ')}`;
      const sim = cosineSimilarity(productTf, termFrequency(analyze(text)));
      return { product: c, sim };
    });
    scored.sort((a, b) => b.sim - a.sim);
    return scored.filter((s) => s.sim > 0.05).slice(0, limit).map((s) => s.product);
  }

  /** Products frequently rented together with the given products. */
  async frequentlyRentedTogether(productIds: string[], limit = 8) {
    const ids = productIds.slice(0, 20);
    if (ids.length === 0) return [];
    const bookings = await BookingRepository.find({
      'product': { $in: ids },
      status: { $in: ['Confirmed', 'Active', 'Completed'] },
    });
    const cooccurrence = new Map<string, number>();
    for (const b of bookings as any[]) {
      const pid = String(b.product?._id || b.product);
      if (ids.includes(pid)) continue;
      cooccurrence.set(pid, (cooccurrence.get(pid) || 0) + 1);
    }
    const sorted = Array.from(cooccurrence.entries()).sort((a, b) => b[1] - a[1]);
    const topIds = sorted.slice(0, limit).map(([id]) => id);
    if (topIds.length === 0) return [];
    return ProductRepository.find(
      { _id: { $in: topIds }, listingStatus: 'active', moderationStatus: 'approved' },
      { populate: [{ path: 'category', select: 'name slug' }, { path: 'owner', select: 'name rating' }] }
    );
  }

  /** Fallback popular products for cold start / anonymous users. */
  async popularProducts(limit = 12) {
    const result = await ProductRepository.listProducts(
      { listingStatus: 'active', moderationStatus: 'approved' },
      { page: 1, limit, sort: 'rating' }
    );
    return result.data as any[];
  }

  private reasonFor(score: number, sim: number): string {
    if (sim > 0.4) return 'similar';
    if (score >= 4) return 'wishlist';
    if (score >= 3) return 'booked';
    if (score >= 2) return 'viewed';
    return 'popular';
  }
}

export default new RecommendationService();
