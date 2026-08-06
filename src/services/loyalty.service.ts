import crypto from 'crypto';
import ApiError from '../utils/ApiError';
import LoyaltyAccountRepository from '../repositories/LoyaltyAccountRepository';
import ReferralRepository from '../repositories/ReferralRepository';
import UserRepository from '../repositories/UserRepository';
import BookingRepository from '../repositories/BookingRepository';
import PaymentRepository from '../repositories/PaymentRepository';
import { MembershipLevel } from '../models/LoyaltyAccount';

// ============================================================
// RentHub - Loyalty Program Service
// ============================================================
// Reward points, membership levels, referral rewards, wallet credits.
// ============================================================

const LEVEL_THRESHOLDS: Record<MembershipLevel, number> = {
  bronze: 0,
  silver: 500,
  gold: 1500,
  platinum: 3000,
};

const POINTS_PER_RUPEE = 1; // 1 point per rupee spent

export class LoyaltyService {
  /**
   * Get or create the user's loyalty account.
   */
  async getAccount(userId: string) {
    const account = await LoyaltyAccountRepository.getOrCreate(userId);
    account.level = this.computeLevel(account.lifetimePoints);
    return account;
  }

  /**
   * Award loyalty points for a completed payment.
   */
  async awardPointsForPayment(userId: string, amount: number, reference?: string) {
    if (amount <= 0) return;
    const points = Math.round(amount * POINTS_PER_RUPEE);
    await LoyaltyAccountRepository.addTransaction(userId, {
      type: 'earn',
      points,
      description: `Points earned for payment of ₹${amount}`,
      reference: reference || '',
      createdAt: new Date(),
    }, points);

    // Update level based on lifetime points
    await this.updateLevel(userId);
  }

  /**
   * Redeem points for wallet credit.
   */
  async redeemPoints(userId: string, points: number) {
    const account = await LoyaltyAccountRepository.getOrCreate(userId);
    if (points <= 0 || points > account.points) {
      throw new ApiError(400, 'Invalid points to redeem');
    }

    const walletCredit = points; // 1 point = ₹1 credit
    await LoyaltyAccountRepository.addTransaction(userId, {
      type: 'redeem',
      points: -points,
      description: `Redeemed ${points} points for wallet credit`,
      createdAt: new Date(),
    }, -points);

    await UserRepository.updateById(userId, {
      $inc: { 'wallet.credit': walletCredit },
      $push: {
        'wallet.transactions': {
          type: 'reward',
          amount: walletCredit,
          status: 'completed',
          description: `Redeemed ${points} loyalty points`,
          createdAt: new Date(),
        },
      },
    });

    return { redeemed: points, walletCredit };
  }

  /**
   * Generate a referral code for a user.
   */
  async getOrCreateReferral(userId: string) {
    const existing = await ReferralRepository.findOne({ referrer: userId as any });
    if (existing) return existing;

    const code = `REF${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    return ReferralRepository.create({
      code,
      referrer: userId as any,
      rewardPoints: 100,
      walletCredit: 50,
      status: 'pending',
    });
  }

  /**
   * Apply a referral code when a new user signs up.
   */
  async applyReferral(referralCode: string, newUserId: string) {
    const referral = await ReferralRepository.findByCode(referralCode);
    if (!referral) return; // Invalid code — ignore silently
    if (referral.referredUser) return; // Already used

    await ReferralRepository.updateById(referral.id, {
      referredUser: newUserId as any,
      status: 'rewarded',
    });

    // Reward the referrer
    await LoyaltyAccountRepository.addTransaction(referral.referrer.toString(), {
      type: 'referral',
      points: referral.rewardPoints,
      description: `Referral reward for ${referral.code}`,
      reference: referral.code,
      createdAt: new Date(),
    }, referral.rewardPoints);

    if (referral.walletCredit > 0) {
      await UserRepository.updateById(referral.referrer.toString(), {
        $inc: { 'wallet.credit': referral.walletCredit },
        $push: {
          'wallet.transactions': {
            type: 'reward',
            amount: referral.walletCredit,
            status: 'completed',
            description: `Referral bonus for ${referral.code}`,
            createdAt: new Date(),
          },
        },
      });
    }

    await this.updateLevel(referral.referrer.toString());
  }

  async listTransactions(userId: string) {
    const account = await LoyaltyAccountRepository.getOrCreate(userId);
    return account.transactions || [];
  }

  private async updateLevel(userId: string) {
    const account = await LoyaltyAccountRepository.getOrCreate(userId);
    const level = this.computeLevel(account.lifetimePoints);
    if (level !== account.level) {
      await LoyaltyAccountRepository.updateById(account.id, { level });
    }
  }

  private computeLevel(lifetimePoints: number): MembershipLevel {
    if (lifetimePoints >= LEVEL_THRESHOLDS.platinum) return 'platinum';
    if (lifetimePoints >= LEVEL_THRESHOLDS.gold) return 'gold';
    if (lifetimePoints >= LEVEL_THRESHOLDS.silver) return 'silver';
    return 'bronze';
  }
}

export default new LoyaltyService();
