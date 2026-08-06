// RefundService unit tests — repositories mocked via vi.mock

vi.mock('../../../src/repositories/RefundRepository', () => ({
  default: {
    create: vi.fn(),
    findById: vi.fn(),
    updateById: vi.fn(),
    findByIdPopulated: vi.fn(),
    listAll: vi.fn(),
    listForOwner: vi.fn(),
    listForUser: vi.fn(),
  },
}));

vi.mock('../../../src/repositories/PaymentRepository', () => ({
  default: {
    findById: vi.fn(),
    updateById: vi.fn(),
  },
}));

vi.mock('../../../src/repositories/BookingRepository', () => ({
  default: {
    updateById: vi.fn(),
  },
}));

vi.mock('../../../src/repositories/UserRepository', () => ({
  default: {
    findById: vi.fn(),
    updateById: vi.fn(),
  },
}));

vi.mock('../../../src/services/notification.service', () => ({
  default: {
    createNotification: vi.fn().mockResolvedValue(undefined),
    notifyRefund: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../../src/services/email.service', () => ({
  default: {
    sendRefundEmail: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../../src/config/razorpay', () => ({
  default: { razorpayInstance: null, isConfigured: false },
  razorpayInstance: null,
  isConfigured: false,
}));

import RefundService from '../../../src/services/refund.service';
import RefundRepository from '../../../src/repositories/RefundRepository';
import PaymentRepository from '../../../src/repositories/PaymentRepository';
import BookingRepository from '../../../src/repositories/BookingRepository';
import UserRepository from '../../../src/repositories/UserRepository';

const mockPayment = {
  _id: 'pay1',
  id: 'pay1',
  booking: 'book1',
  user: 'renter1',
  owner: 'owner1',
  amount: 1000,
  platformFee: 100,
  status: 'completed',
};

const mockRefund = {
  _id: 'ref1',
  id: 'ref1',
  refundId: 'REF1',
  booking: 'book1',
  payment: 'pay1',
  user: 'renter1',
  owner: 'owner1',
  amount: 1000,
  status: 'pending',
  method: 'wallet',
  reason: 'Cancelled',
  initiatedBy: 'admin1',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('RefundService', () => {
  describe('initiateRefund', () => {
    it('creates a refund for a completed payment', async () => {
      (PaymentRepository.findById as any).mockResolvedValue(mockPayment);
      (RefundRepository.create as any).mockResolvedValue(mockRefund);
      (RefundRepository.findById as any).mockResolvedValue(mockRefund);
      (RefundRepository.updateById as any).mockResolvedValue(mockRefund);
      (UserRepository.updateById as any).mockResolvedValue({});

      const result = await RefundService.initiateRefund({
        paymentId: 'pay1',
        amount: 500,
        reason: 'User cancelled',
        method: 'wallet',
        initiatedBy: 'admin1',
      });

      expect(result).toBeDefined();
      expect(RefundRepository.create).toHaveBeenCalled();
    });

    it('throws 404 when payment not found', async () => {
      (PaymentRepository.findById as any).mockResolvedValue(null);
      await expect(
        RefundService.initiateRefund({ paymentId: 'pay1', initiatedBy: 'admin1' })
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('throws 400 when payment not completed', async () => {
      (PaymentRepository.findById as any).mockResolvedValue({ ...mockPayment, status: 'pending' });
      await expect(
        RefundService.initiateRefund({ paymentId: 'pay1', initiatedBy: 'admin1' })
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('throws 400 when amount exceeds payment amount', async () => {
      (PaymentRepository.findById as any).mockResolvedValue(mockPayment);
      await expect(
        RefundService.initiateRefund({ paymentId: 'pay1', amount: 99999, initiatedBy: 'admin1' })
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('listRefunds', () => {
    it('admin lists all refunds', async () => {
      (RefundRepository.listAll as any).mockResolvedValue([mockRefund]);
      const result = await RefundService.listRefunds('admin1', 'admin', {});
      expect(result).toEqual([mockRefund]);
    });

    it('owner lists their refunds', async () => {
      (RefundRepository.listForOwner as any).mockResolvedValue([mockRefund]);
      const result = await RefundService.listRefunds('owner1', 'owner', {});
      expect(result).toEqual([mockRefund]);
    });

    it('customer lists their refunds', async () => {
      (RefundRepository.listForUser as any).mockResolvedValue([mockRefund]);
      const result = await RefundService.listRefunds('renter1', 'customer', {});
      expect(result).toEqual([mockRefund]);
    });
  });

  describe('getRefund', () => {
    it('throws 404 when refund not found', async () => {
      (RefundRepository.findByIdPopulated as any).mockResolvedValue(null);
      await expect(RefundService.getRefund('ref1', 'admin1', 'admin')).rejects.toMatchObject({ statusCode: 404 });
    });

    it('throws 403 for unauthorized user', async () => {
      (RefundRepository.findByIdPopulated as any).mockResolvedValue(mockRefund);
      await expect(RefundService.getRefund('ref1', 'stranger', 'customer')).rejects.toMatchObject({ statusCode: 403 });
    });

    it('returns refund for owner', async () => {
      (RefundRepository.findByIdPopulated as any).mockResolvedValue(mockRefund);
      const result = await RefundService.getRefund('ref1', 'owner1', 'owner');
      expect(result).toEqual(mockRefund);
    });
  });
});
