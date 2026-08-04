import SearchAnalytics, { ISearchAnalytics } from '../models/SearchAnalytics';
import BaseRepository from './BaseRepository';

class SearchAnalyticsRepository extends BaseRepository<ISearchAnalytics> {
  constructor() {
    super(SearchAnalytics);
  }

  async recordSearch(data: Partial<ISearchAnalytics>): Promise<ISearchAnalytics> {
    return this.create(data);
  }

  async recordClick(data: Partial<ISearchAnalytics>): Promise<ISearchAnalytics> {
    return this.create({ ...data, isClick: true });
  }

  /** Aggregate top search queries by count within a window. */
  async trendingQueries(
    limit = 10,
    days = 7,
    minCount = 2
  ): Promise<{ query: string; count: number }[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const result = await SearchAnalytics.aggregate([
      { $match: { createdAt: { $gte: since }, query: { $exists: true, $ne: '' } } },
      { $group: { _id: { $toLower: '$query' }, count: { $sum: 1 } } },
      { $match: { count: { $gte: minCount } } },
      { $sort: { count: -1 } },
      { $limit: limit },
      { $project: { _id: 0, query: '$_id', count: 1 } },
    ]).exec();
    return result;
  }

  /** Most frequent successful queries (resultCount > 0) as popular searches. */
  async popularQueries(limit = 10): Promise<{ query: string; count: number }[]> {
    const result = await SearchAnalytics.aggregate([
      { $match: { resultCount: { $gt: 0 }, query: { $exists: true, $ne: '' } } },
      { $group: { _id: { $toLower: '$query' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
      { $project: { _id: 0, query: '$_id', count: 1 } },
    ]).exec();
    return result;
  }

  /** Recent distinct searches for a user. */
  async recentQueries(userId: string, limit = 10): Promise<{ query: string; lastSearched: Date }[]> {
    const result = await SearchAnalytics.aggregate([
      { $match: { user: userId, query: { $exists: true, $ne: '' } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: { $toLower: '$query' },
          lastSearched: { $first: '$createdAt' },
        },
      },
      { $sort: { lastSearched: -1 } },
      { $limit: limit },
      { $project: { _id: 0, query: '$_id', lastSearched: 1 } },
    ]).exec();
    return result;
  }

  /** All distinct queries that contain a given prefix/substring (for autocomplete). */
  async querySuggestions(term: string, limit = 10): Promise<string[]> {
    const result = await SearchAnalytics.aggregate([
      { $match: { normalizedQuery: { $regex: '^' + this.escapeRegex(term) } } },
      { $group: { _id: '$normalizedQuery', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
      { $project: { _id: 0, query: '$_id' } },
    ]).exec();
    return result.map((r) => r.query);
  }

  private escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

export default new SearchAnalyticsRepository();
