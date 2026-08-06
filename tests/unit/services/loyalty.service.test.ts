// LoyaltyService unit tests — repositories mocked via vi.mock

vi.mock('../../../src/repositories/LoyaltyAccountRepository', () => ({
  default: {
    getOrCreate: vi.fn(),
    addTransaction: vi.fn(),
    updateById: vi.fn(),
  },
}));

vi.mock('../../../src/repositories/ReferralRepository', () => ({
  default: {
    findOne: vi.fn(),
    findByCode: vi.fn(),
    create: vi.fn(),
    updateById: vi.fn(),
  },
}));

vi.mock('../../../src/repositories/UserRepository', () => ({
  default: {
    updateById: vi.fn(),
  },
}));

import LoyaltyService from '../../../src/services/loyalty.service';
import LoyaltyAccountRepository from '../../../src/repositories/LoyaltyAccountRepository';
import ReferralRepository from '../../../src/repositories/ReferralRepository';
import UserRepository from '../../../src/repositories/UserRepository';

const mockAccount = {
  id: 'acc1',
  user: 'user1',
  points: 1000,
  lifetimePoints: 1000,
  level: 'silver',
  transactions: [],
};

const mockReferral = {
  id: 'ref1',
  code: 'REFABC',
  referrer: { toString: () => 'user1' },
  rewardPoints: 100,
  walletCredit: 50,
  status: 'pending',
  referredUser: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('LoyaltyService', () => {
  describe('getAccount', () => {
    it('returns account with computed level', async () => {
      (LoyaltyAccountRepository.getOrCreate as any).mockResolvedValue(mockAccount);
      const result = await LoyaltyService.getAccount('user1');
      expect(result.level).toBe('silver');
    });
  });

  describe('awardPointsForPayment', () => {
    it('awards points for positive amount', async () => {
      (LoyaltyAccountRepository.addTransaction as any).mockResolvedValue(null);
      (LoyaltyAccountRepository.getOrCreate as any).mockResolvedValue(mockAccount);
      await LoyaltyService.awardPointsForPayment('user1', 1000);
      expect(LoyaltyAccountRepository.addTransaction).toHaveBeenCalled();
    });

    it('does nothing for zero amount', async () => {
      await LoyaltyService.awardPointsForPayment('user1', 0);
      expect(LoyaltyAccountRepository.addTransaction).not.toHaveBeenCalled();
    });
  });

  describe('redeemPoints', () => {
    it('redeems valid points', async () => {
      (LoyaltyAccountRepository.getOrCreate as any).mockResolvedValue(mockAccount);
      (LoyaltyAccountRepository.addTransaction as any).mockResolvedValue(null);
      (UserRepository.updateById as any).mockResolvedValue(null);
      const result = await LoyaltyService.redeemPoints('user1', 100);
      expect(result).toEqual({ redeemed: 100, walletCredit: 100 });
    });

    it('throws 400 when points exceed balance', async () => {
      (LoyaltyAccountRepository.getOrCreate as any).mockResolvedValue(mockAccount);
      await expect(LoyaltyService.redeemPoints('user1', 99999)).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('getOrCreateReferral', () => {
    it('returns existing referral', async () => {
      (ReferralRepository.findOne as any).mockResolvedValue(mockReferral);
      const result = await LoyaltyService.getOrCreateReferral('user1');
      expect(result).toEqual(mockReferral);
    });

    it('creates a new referral when none exists', async () => {
      (ReferralRepository.findOne as any).mockResolvedValue(null);
      (ReferralRepository.create as any).mockResolvedValue(mockReferral);
      const result = await LoyaltyService.getOrCreateReferral('user1');
      expect(result).toEqual(mockReferral);
      expect(ReferralRepository.create).toHaveBeenCalled();
    });
  });

  describe('applyReferral', () => {
    it('rewards referrer on valid referral', async () => {
      (ReferralRepository.findByCode as any).mockResolvedValue(mockReferral);
      (ReferralRepository.updateById as any).mockResolvedValue(mockReferral);
      (LoyaltyAccountRepository.addTransaction as any).mockResolvedValue(null);
      (UserRepository.updateById as any).mockResolvedValue(null);
      (LoyaltyAccountRepository.getOrCreate as any).mockResolvedValue(mockAccount);
      await LoyaltyService.applyReferral('REFABC', 'newuser1');
      expect(ReferralRepository.updateById).toHaveBeenCalled();
    });

    it('ignores invalid referral code', async () => {
      (ReferralRepository.findByCode as any).mockResolvedValue(null);
      await expect(LoyaltyService.applyReferral('BADCODE', 'newuser1')).resolves.toBeUndefined();
    });
  });

  describe('listTransactions', () => {
    it('returns account transactions', async () => {
      (LoyaltyAccountRepository.getOrCreate as any).mockResolvedValue({ ...mockAccount, transactions: [{ type: 'earn', points: 100 }] });
      const result = await LoyaltyService.listTransactions('user1');
      expect(result).toHaveLength(1);
    });
  });
});
