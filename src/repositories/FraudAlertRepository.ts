import FraudAlert, { IFraudAlert, FraudStatus } from '../models/FraudAlert';
import BaseRepository from './BaseRepository';

class FraudAlertRepository extends BaseRepository<IFraudAlert> {
  constructor() {
    super(FraudAlert);
  }

  async createAlert(data: Partial<IFraudAlert>): Promise<IFraudAlert> {
    return this.create(data);
  }

  async listOpen(limit = 50): Promise<IFraudAlert[]> {
    return this.find(
      { status: { $in: ['open', 'investigating'] } } as any,
      { sort: { severity: -1 as 1 | -1, createdAt: -1 as 1 | -1 }, limit }
    );
  }

  async listAll(options: { status?: FraudStatus; limit?: number; skip?: number } = {}) {
    const filter: Record<string, unknown> = {};
    if (options.status) filter.status = options.status;
    const limit = options.limit || 50;
    const skip = options.skip || 0;
    const total = await this.countDocuments(filter as any);
    const data = await this.find(filter as any, {
      sort: { createdAt: -1 as 1 | -1 },
      limit,
      skip,
    });
    return { data, total, limit, skip };
  }

  async updateStatus(id: string, status: FraudStatus, resolvedBy?: string): Promise<IFraudAlert | null> {
    const update: Record<string, unknown> = { status };
    if (status === 'resolved' || status === 'dismissed') {
      update.resolvedAt = new Date();
      if (resolvedBy) update.resolvedBy = resolvedBy;
    }
    return this.updateById(id, update);
  }
}

export default new FraudAlertRepository();
