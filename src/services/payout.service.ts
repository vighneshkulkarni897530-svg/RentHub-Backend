import ApiError from '../utils/ApiError';
import PayoutRepository from '../repositories/PayoutRepository';
import PaymentRepository from '../repositories/PaymentRepository';
import UserRepository from '../repositories/UserRepository';
import notificationService from './notification.service';

// ============================================================
// RentHub - Payout / Owner Settlement Service
// ============================================================
// Owner settlements: compute due earnings, create payout records,
// track payout status, and credit wallet on completion.
// ============================================================

export class PayoutService {
  /**
   * Compute an owner's current settlement balance from completed payments.
   */
  async getSettlementSummary(ownerId: string) {
    const payments = await PaymentRepository.find({ owner: ownerId, status: 'completed' });
    const totalEarnings = payments.reduce((s: number, p: any) => s + (p.netAmount || p.amount || 0), 0);
    const settled = await PayoutRepository.find({ owner: ownerId, status: 'completed' });
    const settledAmount = settled.reduce((s: number, p: any) => s + (p.netAmount || p.amount || 0), 0);
    const pendingPayouts = await PayoutRepository.find({ owner: ownerId, status: { $in: ['pending', 'processing'] } });
    const pendingAmount = pendingPayouts.reduce((s: number, p: any) => s + (p.netAmount || p.amount || 0), 0);

    return {
      totalEarnings,
      settledAmount,
      pendingAmount,
      availableBalance: totalEarnings - settledAmount - pendingAmount,
      completedPayouts: settled.length,
      pendingPayoutCount: pendingPayouts.length,
      totalBookings: payments.length,
    };
  }

  /**
   * Create a payout request for an owner.
   */
  async createPayout(ownerId: string, input: { amount?: number; method: 'bank' | 'upi' | 'wallet'; accountDetails?: Record<string, unknown> }) {
    const summary = await this.getSettlementSummary(ownerId);
    const amount = input.amount || summary.availableBalance;

    if (amount <= 0 || amount > summary.availableBalance) {
      throw new ApiError(400, 'Invalid payout amount');
    }

    // Platform fee assumed 0 for now (or fixed 2%)
    const platformFee = Math.round(amount * 0.0 * 100) / 100;
    const netAmount = Math.round((amount - platformFee) * 100) / 100;

    const payout = await PayoutRepository.create({
      payoutId: `PO-${Date.now().toString(36).toUpperCase()}`,
      owner: ownerId as any,
      amount,
      platformFee,
      netAmount,
      status: 'pending',
      method: input.method,
      accountDetails: input.accountDetails || {},
    });

    void this.processPayout(payout.id as unknown as string);

    return payout;
  }

  /**
   * Process a payout (simulate bank/UPI transfer or credit wallet).
   */
  async processPayout(payoutId: string) {
    const payout = await PayoutRepository.findById(payoutId);
    if (!payout) return;
    if (payout.status !== 'pending') return;

    await PayoutRepository.updateById(payoutId, { status: 'processing' });

    try {
      if (payout.method === 'wallet') {
        await UserRepository.updateById(payout.owner.toString(), {
          $inc: { 'wallet.balance': payout.netAmount },
          $push: {
            'wallet.transactions': {
              type: 'withdrawal',
              amount: payout.netAmount,
              status: 'completed',
              description: `Payout ${payout.payoutId}`,
              reference: payout.payoutId,
              createdAt: new Date(),
            },
          },
        });
      }

      await PayoutRepository.updateById(payoutId, {
        status: 'completed',
        processedAt: new Date(),
        reference: `ref_${payout.payoutId}`,
      });

      void notificationService.createNotification({
        userId: payout.owner.toString(),
        type: 'payment',
        title: 'Payout completed',
        message: `Your payout of ₹${payout.netAmount} has been processed.`,
        link: '/owner/earnings',
      });
    } catch (error) {
      await PayoutRepository.updateById(payoutId, {
        status: 'failed',
        failureReason: (error as Error).message,
      });
    }
  }

  async listPayouts(userId: string, role: string, options: any) {
    if (role === 'admin') return PayoutRepository.listAll(options);
    return PayoutRepository.listForOwner(userId, options);
  }

  async getPayout(id: string) {
    const payout = await PayoutRepository.findById(id);
    if (!payout) throw new ApiError(404, 'Payout not found');
    return payout;
  }
}

export default new PayoutService();
