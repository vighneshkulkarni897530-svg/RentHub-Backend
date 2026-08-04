import AIInsight, { IAIInsight, InsightType } from '../models/AIInsight';
import BaseRepository from './BaseRepository';

class AIInsightRepository extends BaseRepository<IAIInsight> {
  constructor() {
    super(AIInsight);
  }

  async getCached(
    type: InsightType,
    scope: string,
    ownerId?: string,
    productId?: string
  ): Promise<IAIInsight | null> {
    const filter: Record<string, unknown> = { type, scope };
    if (ownerId) filter.ownerId = ownerId;
    if (productId) filter.productId = productId;
    filter.expiresAt = { $gt: new Date() };
    return this.findOne(filter as any);
  }

  async cache(data: Partial<IAIInsight>): Promise<IAIInsight> {
    return this.create(data);
  }

  async clearFor(scopes: { type: InsightType; scope: string; ownerId?: string; productId?: string }[]): Promise<void> {
    for (const s of scopes) {
      const filter: Record<string, unknown> = { type: s.type, scope: s.scope };
      if (s.ownerId) filter.ownerId = s.ownerId;
      if (s.productId) filter.productId = s.productId;
      await this.deleteMany(filter as any);
    }
  }
}

export default new AIInsightRepository();
