// PayoutService unit tests — repositories mocked via vi.mock

vi.mock('../../../src/repositories/PayoutRepository', () => ({
  default: {
    create: vi.fn(),
    findById: vi.fn(),
    updateById: vi.fn(),
    listAll: vi.fn(),
    listForOwner: vi.fn(),
    find: vi.fn(),
  },
}));

vi.mock('../../../src/repositories/PaymentRepository', () => ({
  default: {
    find: vi.fn(),
  },
}));

vi.mock('../../../src/repositories/UserRepository', () => ({
  default: {
    updateById: vi.fn(),
  },
}));

vi.mock('../../../src/services/notification.service', () => ({
  default: {
    createNotification: vi.fn().mockResolvedValue(undefined),
  },
}));

import PayoutService from '../../../src/services/payout.service';
import PayoutRepository from '../../../src/repositories/PayoutRepository';
import PaymentRepository from '../../../src/repositories/PaymentRepository';
import UserRepository from '../../../src/repositories/UserRepository';

const mockPayment = { _id: 'pay1', netAmount: 500, amount: 500, status: 'completed' };
const mockPayout = {
  _id: 'po1',
  id: 'po1',
  payoutId: 'PO1',
  owner: 'owner1',
  amount: 500,
  platformFee: 0,
  netAmount: 500,
  status: 'pending',
  method: 'wallet',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PayoutService', () => {
  describe('getSettlementSummary', () => {
    it('computes settlement summary', async () => {
      (PaymentRepository.find as any).mockResolvedValue([mockPayment, mockPayment]);
      (PayoutRepository.find as any).mockResolvedValue([]);
      const result = await PayoutService.getSettlementSummary('owner1');
      expect(result.totalEarnings).toBe(1000);
      expect(result.availableBalance).toBe(1000);
    });
  });

  describe('createPayout', () => {
    it('creates a payout for available balance', async () => {
      (PaymentRepository.find as any).mockResolvedValue([mockPayment, mockPayment]);
      (PayoutRepository.find as any).mockResolvedValue([]);
      (PayoutRepository.create as any).mockResolvedValue(mockPayout);
      (PayoutRepository.findById as any).mockResolvedValue(mockPayout);
      (PayoutRepository.updateById as any).mockResolvedValue(mockPayout);
      (UserRepository.updateById as any).mockResolvedValue({});

      const result = await PayoutService.createPayout('owner1', { method: 'wallet' });
      expect(result).toBeDefined();
      expect(PayoutRepository.create).toHaveBeenCalled();
    });

    it('throws 400 when amount exceeds available balance', async () => {
      (PaymentRepository.find as any).mockResolvedValue([mockPayment]);
      (PayoutRepository.find as any).mockResolvedValue([]);
      await expect(
        PayoutService.createPayout('owner1', { method: 'bank', amount: 99999 })
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('listPayouts', () => {
    it('admin lists all', async () => {
      (PayoutRepository.listAll as any).mockResolvedValue([mockPayout]);
      const result = await PayoutService.listPayouts('admin1', 'admin', {});
      expect(result).toEqual([mockPayout]);
    });

    it('owner lists their payouts', async () => {
      (PayoutRepository.listForOwner as any).mockResolvedValue([mockPayout]);
      const result = await PayoutService.listPayouts('owner1', 'owner', {});
      expect(result).toEqual([mockPayout]);
    });
  });
});
