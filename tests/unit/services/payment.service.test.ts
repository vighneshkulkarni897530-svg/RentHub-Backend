// PaymentService unit tests — repositories mocked via vi.mock

vi.mock('../../../src/repositories/PaymentRepository', () => ({
  default: {
    findByIdPopulated: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    updateById: vi.fn(),
    findByRazorpayOrderId: vi.fn(),
    listAll: vi.fn(),
    listForOwner: vi.fn(),
    listForUser: vi.fn(),
    find: vi.fn(),
  },
}));

vi.mock('../../../src/repositories/BookingRepository', () => ({
  default: {
    findByIdPopulated: vi.fn(),
    updateById: vi.fn(),
  },
}));

vi.mock('../../../src/services/notification.service', () => ({
  default: {
    createNotification: vi.fn().mockResolvedValue(undefined),
    notifyBookingCreated: vi.fn().mockResolvedValue(undefined),
    notifyPaymentReceived: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../../src/config/razorpay', () => ({
  default: { razorpayInstance: null, isConfigured: false },
  razorpayInstance: null,
  isConfigured: false,
}));

import PaymentService from '../../../src/services/payment.service';
import PaymentRepository from '../../../src/repositories/PaymentRepository';
import BookingRepository from '../../../src/repositories/BookingRepository';

const mockBooking = {
  id: 'book1',
  _id: 'book1',
  renter: { _id: 'renter1' },
  owner: { _id: 'owner1' },
  grandTotal: 1000,
  totalPrice: 900,
  platformFee: 100,
  paymentStatus: 'pending',
};

const mockPayment = {
  id: 'pay1',
  _id: 'pay1',
  booking: 'book1',
  user: 'renter1',
  owner: 'owner1',
  razorpayOrderId: 'order1',
  amount: 1000,
  platformFee: 100,
  netAmount: 900,
  status: 'pending',
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PaymentService', () => {
  describe('createOrder', () => {
    it('creates a mock order when razorpay not configured', async () => {
      (BookingRepository.findByIdPopulated as any).mockResolvedValue(mockBooking);
      (PaymentRepository.findOne as any).mockResolvedValue(null);
      (PaymentRepository.create as any).mockResolvedValue(mockPayment);
      const result = await PaymentService.createOrder('book1', 'renter1');
      expect(result.orderId).toMatch(/^mock_/);
      expect(result.amount).toBe(100000);
      expect(result.key).toBe('mock_key');
    });

    it('throws 404 when booking not found', async () => {
      (BookingRepository.findByIdPopulated as any).mockResolvedValue(null);
      await expect(PaymentService.createOrder('book1', 'renter1')).rejects.toMatchObject({ statusCode: 404 });
    });

    it('throws 403 when not renter', async () => {
      (BookingRepository.findByIdPopulated as any).mockResolvedValue(mockBooking);
      await expect(PaymentService.createOrder('book1', 'stranger')).rejects.toMatchObject({ statusCode: 403 });
    });

    it('throws 400 when already paid', async () => {
      (BookingRepository.findByIdPopulated as any).mockResolvedValue({ ...mockBooking, paymentStatus: 'paid' });
      await expect(PaymentService.createOrder('book1', 'renter1')).rejects.toMatchObject({ statusCode: 400 });
    });

    it('updates existing payment record', async () => {
      (BookingRepository.findByIdPopulated as any).mockResolvedValue(mockBooking);
      (PaymentRepository.findOne as any).mockResolvedValue(mockPayment);
      (PaymentRepository.updateById as any).mockResolvedValue(mockPayment);
      const result = await PaymentService.createOrder('book1', 'renter1');
      expect(result).toBeDefined();
      expect(PaymentRepository.updateById).toHaveBeenCalled();
    });
  });

  describe('verifyPayment', () => {
    it('verifies payment when razorpay not configured', async () => {
      (PaymentRepository.findByRazorpayOrderId as any).mockResolvedValue(mockPayment);
      (PaymentRepository.updateById as any).mockResolvedValue(mockPayment);
      (BookingRepository.updateById as any).mockResolvedValue({});
      const result = await PaymentService.verifyPayment(
        { razorpay_order_id: 'order1', razorpay_payment_id: 'pay1', razorpay_signature: 'sig' },
        'renter1'
      );
      expect(BookingRepository.updateById).toHaveBeenCalledWith('book1', { paymentStatus: 'paid' });
      expect(result).toBeDefined();
    });

    it('throws 404 when payment not found', async () => {
      (PaymentRepository.findByRazorpayOrderId as any).mockResolvedValue(null);
      await expect(
        PaymentService.verifyPayment(
          { razorpay_order_id: 'order1', razorpay_payment_id: 'pay1', razorpay_signature: 'sig' },
          'renter1'
        )
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('throws 403 when not payment owner', async () => {
      (PaymentRepository.findByRazorpayOrderId as any).mockResolvedValue(mockPayment);
      await expect(
        PaymentService.verifyPayment(
          { razorpay_order_id: 'order1', razorpay_payment_id: 'pay1', razorpay_signature: 'sig' },
          'stranger'
        )
      ).rejects.toMatchObject({ statusCode: 403 });
    });
  });

  describe('getPayments', () => {
    it('admin lists all', async () => {
      (PaymentRepository.listAll as any).mockResolvedValue([mockPayment]);
      const result = await PaymentService.getPayments('admin1', 'admin', {});
      expect(result).toEqual([mockPayment]);
    });

    it('owner lists their payments', async () => {
      (PaymentRepository.listForOwner as any).mockResolvedValue([mockPayment]);
      const result = await PaymentService.getPayments('owner1', 'owner', {});
      expect(result).toEqual([mockPayment]);
    });

    it('customer lists their payments', async () => {
      (PaymentRepository.listForUser as any).mockResolvedValue([mockPayment]);
      const result = await PaymentService.getPayments('renter1', 'customer', {});
      expect(result).toEqual([mockPayment]);
    });
  });

  describe('getEarnings', () => {
    it('returns earnings summary', async () => {
      (PaymentRepository.find as any).mockResolvedValue([
        { netAmount: 500, createdAt: new Date(), updatedAt: new Date() },
        { netAmount: 300, createdAt: new Date(), updatedAt: new Date() },
      ]);
      const result = await PaymentService.getEarnings('owner1');
      expect(result.total).toBe(800);
      expect(result.count).toBe(2);
    });
  });
});
