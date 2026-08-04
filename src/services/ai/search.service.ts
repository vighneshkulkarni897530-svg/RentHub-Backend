import SearchAnalyticsRepository from '../../repositories/SearchAnalyticsRepository';
import ProductRepository from '../../repositories/ProductRepository';
import CategoryRepository from '../../repositories/CategoryRepository';
import { normalize, editDistance, analyze } from '../../utils/ai/text';
import { Types } from 'mongoose';

/**
 * Smart Search service: autocomplete, typo correction, related searches,
 * trending searches, popular searches, and recent searches.
 */
export class SmartSearchService {
  /** Autocomplete suggestions from search history + product/category titles. */
  async autocomplete(term: string, userId?: string, limit = 8) {
    const q = normalize(term).trim();
    if (!q) return { suggestions: [], hasTypo: false, corrected: null };

    const history = await SearchAnalyticsRepository.querySuggestions(q, limit);

    // Complement with product titles and category names.
    const productTitles = await this.productTitleSuggestions(q, limit);
    const categoryNames = await this.categorySuggestions(q, limit);

    const seen = new Set<string>();
    const suggestions: string[] = [];
    for (const s of [...history, ...productTitles, ...categoryNames]) {
      if (s && !seen.has(s)) {
        seen.add(s);
        suggestions.push(s);
      }
      if (suggestions.length >= limit) break;
    }

    return { suggestions, hasTypo: false, corrected: null };
  }

  /** Correct typos by comparing against known queries/product titles. */
  async correctTypo(term: string, limit = 5) {
    const q = normalize(term).trim();
    if (!q) return { corrected: null, alternatives: [] };

    const candidates = await this.allSearchTerms(limit * 3);
    const scored = candidates
      .map((candidate) => ({
        candidate,
        distance: editDistance(q, candidate),
      }))
      .filter((s) => s.distance > 0 && s.distance <= Math.max(1, Math.floor(q.length / 3)))
      .sort((a, b) => a.distance - b.distance);

    const alternatives = scored.slice(0, limit).map((s) => s.candidate);
    return {
      corrected: alternatives[0] || null,
      alternatives,
    };
  }

  /** Related search suggestions for a given query. */
  async relatedSearches(term: string, limit = 6) {
    const q = normalize(term).trim();
    if (!q) return [];

    const tokens = analyze(q);
    const all = await SearchAnalyticsRepository.trendingQueries(50, 30, 1);
    const related = all
      .map((row) => {
        const rowTokens = analyze(row.query);
        const overlap = rowTokens.filter((t) => tokens.includes(t)).length;
        return { query: row.query, score: overlap / Math.max(1, Math.max(tokens.length, rowTokens.length)) };
      })
      .filter((r) => r.score > 0 && r.query !== q)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((r) => r.query);

    return related;
  }

  /** Trending searches (from recent analytics). */
  async trending(limit = 10) {
    return SearchAnalyticsRepository.trendingQueries(limit, 7, 2);
  }

  /** Popular searches (all-time successful). */
  async popular(limit = 10) {
    return SearchAnalyticsRepository.popularQueries(limit);
  }

  /** Recent searches for a user. */
  async recent(userId: string, limit = 10) {
    return SearchAnalyticsRepository.recentQueries(userId, limit);
  }

  /** Record a search event (for analytics + personalization). */
  async recordSearch(input: {
    query: string;
    userId?: string;
    sessionId?: string;
    resultCount?: number;
    category?: string;
    location?: string;
    source?: string;
  }) {
    const query = normalize(input.query).trim();
    if (!query) return null;
    return SearchAnalyticsRepository.recordSearch({
      query,
      normalizedQuery: query,
      user: input.userId ? input.userId as any : undefined,
      sessionId: input.sessionId,
      resultCount: input.resultCount || 0,
      category: input.category,
      location: input.location,
      source: (input.source as any) || 'search',
    });
  }

/** Record a product click for a search. */
  async recordClick(input: { query: string; productId: string; userId?: string; sessionId?: string }) {
    const query = normalize(input.query).trim();
    if (!query) return null;
    return SearchAnalyticsRepository.recordClick({
      query,
      normalizedQuery: query,
      clickedProductId: input.productId as any,
      user: input.userId ? input.userId as any : undefined,
      sessionId: input.sessionId,
    });
  }

  private async productTitleSuggestions(term: string, limit: number): Promise<string[]> {
    const result = await ProductRepository.find(
      { title: { $regex: new RegExp('^' + this.escapeRegex(term), 'i') } } as any,
      { select: 'title', limit, sort: { bookingsCount: -1 as 1 | -1 } }
    );
    return (result as any[]).map((p) => p.title);
  }

  private async categorySuggestions(term: string, limit: number): Promise<string[]> {
    const result = await CategoryRepository.find(
      { name: { $regex: new RegExp('^' + this.escapeRegex(term), 'i') } } as any,
      { select: 'name', limit }
    );
    return (result as any[]).map((c) => c.name);
  }

  private async allSearchTerms(limit: number): Promise<string[]> {
    const result = await SearchAnalyticsRepository.trendingQueries(limit, 90, 1);
    const titles = await ProductRepository.find({}, { select: 'title', limit: 50 });
    const names = await CategoryRepository.find({}, { select: 'name', limit: 50 });
    const set = new Set<string>();
    for (const r of result) if (r.query) set.add(r.query);
    for (const t of titles as any[]) if (t.title) set.add(t.title);
    for (const n of names as any[]) if (n.name) set.add(n.name);
    return Array.from(set);
  }

  private escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

export default new SmartSearchService();
