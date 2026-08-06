import crypto from 'crypto';
import ApiError from '../utils/ApiError';
import env from '../config/env';
import PaymentRepository from '../repositories/PaymentRepository';
import BookingRepository from '../repositories/BookingRepository';
import notificationService from './notification.service';
import emailService from './email.service';
import invoiceService from './invoice.service';
import refundService from './refund.service';
import payoutService from './payout.service';
import loyaltyService from './loyalty.service';
import { razorpayInstance, isConfigured } from '../config/razorpay';

// ============================================================
// RentHub - Payment Service (Razorpay production integration)
// ============================================================
// - Payment orders (UPI / Cards / Net Banking / Wallets)
// - Signature verification
// - Payment history
// - Invoice generation on completion
// - Refund workflow delegation
// - Owner payout/settlement tracking
// Preserves all existing endpoints & behavior.
// ============================================================

export class PaymentService {
  /**
   * Create a Razorpay order for a booking.
   * If Razorpay is not configured, falls back to a mock order
   * so the flow can still be tested end-to-end.
   */
  async createOrder(bookingId: string, userId: string) {
    const booking = await BookingRepository.findByIdPopulated(bookingId);
    if (!booking) throw new ApiError(404, 'Booking not found');
    if (booking.renter._id.toString() !== userId) {
      throw new ApiError(403, 'You can only pay for your own bookings');
    }
    if (booking.paymentStatus === 'paid') {
      throw new ApiError(400, 'Booking is already paid');
    }

    const amountInPaise = Math.round((booking.grandTotal || booking.totalPrice) * 100);

    let orderId = `mock_${Date.now()}`;
    if (isConfigured && razorpayInstance) {
      try {
        const order = await razorpayInstance.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: `receipt_${booking.id}`,
          notes: { bookingId: booking.id.toString(), userId },
        });
        orderId = order.id;
      } catch (error) {
        throw new ApiError(502, 'Payment gateway error. Please try again.');
      }
    }

    // Create/update a payment record
    const existingPayment = await PaymentRepository.findOne({ booking: bookingId });
    let payment;
    if (existingPayment) {
      payment = await PaymentRepository.updateById(existingPayment.id, {
        razorpayOrderId: orderId,
        amount: booking.grandTotal || booking.totalPrice,
        status: 'pending',
      });
    } else {
      payment = await PaymentRepository.create({
        booking: bookingId as any,
        user: userId as any,
        owner: booking.owner._id as any,
        razorpayOrderId: orderId,
        amount: booking.grandTotal || booking.totalPrice,
        platformFee: booking.platformFee || 0,
        netAmount: (booking.grandTotal || booking.totalPrice) - (booking.platformFee || 0),
        status: 'pending',
        method: 'razorpay',
        transactionId: `txn_${Date.now()}`,
      });
    }

    if (!payment) throw new ApiError(500, 'Failed to create payment record');

    return {
      orderId,
      amount: amountInPaise,
      currency: 'INR',
      key: isConfigured ? env.razorpay.keyId : 'mock_key',
      bookingId: booking.id,
      paymentId: payment.id,
    };
  }

  /**
   * Verify a Razorpay payment signature and mark the booking as paid.
   * If Razorpay is not configured, accepts the mock payment.
   */
  async verifyPayment(input: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }, userId: string) {
    const payment = await PaymentRepository.findByRazorpayOrderId(input.razorpay_order_id);
    if (!payment) throw new ApiError(404, 'Payment record not found');

    if (payment.user.toString() !== userId) {
      throw new ApiError(403, 'You can only verify your own payments');
    }

    let valid = true;
    if (isConfigured) {
      const expectedSignature = crypto
        .createHmac('sha256', env.razorpay.keySecret)
        .update(`${input.razorpay_order_id}|${input.razorpay_payment_id}`)
        .digest('hex');
      valid = expectedSignature === input.razorpay_signature;
    }

    if (!valid) {
      await PaymentRepository.updateById(payment.id, { status: 'failed' });
      throw new ApiError(400, 'Payment verification failed');
    }

    const updatedPayment = await PaymentRepository.updateById(payment.id, {
      razorpayPaymentId: input.razorpay_payment_id,
      status: 'completed',
      completedAt: new Date(),
    });

    // Mark booking as paid
    await BookingRepository.updateById(payment.booking.toString(), {
      paymentStatus: 'paid',
    });

    // Notify owner
    void notificationService.notifyPaymentReceived({
      userId: payment.owner.toString(),
      title: 'Payment received',
      message: 'A payment has been received for your booking.',
      link: '/owner/earnings',
    });

    // --- Phase 12 enterprise workflows (best-effort, non-blocking) ---
    // 1. Generate invoice
    void invoiceService.createInvoiceForPayment(payment.id).catch(() => null);
    // 2. Send payment confirmation email
    void emailService.sendPaymentSuccessEmail(
      (payment as any).user?.email || 'customer@renthub.com',
      (payment as any).user?.name || 'Customer',
      {
        amount: payment.amount,
        transactionId: payment.razorpayPaymentId || payment.transactionId,
        link: `${env.clientUrl}/customer/invoices`,
      }
    ).catch(() => null);
    // 3. Award loyalty points
    void loyaltyService.awardPointsForPayment(payment.user.toString(), payment.amount, payment.id).catch(() => null);

    return updatedPayment;
  }

  async getPayments(userId: string, role: string, options: any) {
    if (role === 'admin') return PaymentRepository.listAll(options);
    if (role === 'owner') return PaymentRepository.listForOwner(userId, options);
    return PaymentRepository.listForUser(userId, options);
  }

  async getEarnings(ownerId: string) {
    const payments = await PaymentRepository.find({ owner: ownerId, status: 'completed' });
    const total = payments.reduce((s: number, p: any) => s + (p.netAmount || p.amount || 0), 0);
    const monthly = new Map<string, { amount: number; bookings: number }>();
    for (const p of payments as any[]) {
      const key = new Date(p.createdAt || p.updatedAt || Date.now()).toLocaleString('en-US', { month: 'short' });
      const entry = monthly.get(key) || { amount: 0, bookings: 0 };
      entry.amount += p.netAmount || p.amount || 0;
      entry.bookings += 1;
      monthly.set(key, entry);
    }
// --- Phase 12: payout / settlement tracking ---
    let settlement = { totalEarnings: 0, settledAmount: 0, pendingAmount: 0, availableBalance: 0 };
    try {
      settlement = await payoutService.getSettlementSummary(ownerId);
    } catch {
      // ignore settlement errors — earnings still returned
    }

    return {
      total,
      monthly: Array.from(monthly.entries()).map(([month, value]) => ({ month, ...value })),
      count: payments.length,
      availableBalance: settlement.availableBalance,
    };
  }

  /**
   * Get payment history (alias of getPayments with richer metadata).
   */
  async getPaymentHistory(userId: string, role: string, options: any) {
    const result = await this.getPayments(userId, role, options);
    if (result?.data) {
      result.data = result.data.map((p: any) => ({
        ...(p.toObject ? p.toObject() : p),
        hasInvoice: Boolean((p as any).transactionId),
        canRefund: ['completed'].includes(p.status),
      }));
    }
    return result;
  }

  /**
   * Refund workflow entry point (admin/owner initiated) — delegates to RefundService.
   */
  async initiateRefund(input: { paymentId: string; amount?: number; reason?: string; method?: 'original' | 'wallet'; initiatedBy: string }) {
    return refundService.initiateRefund(input);
  }

  /**
   * Payout tracking — delegates to PayoutService.
   */
  async createPayout(ownerId: string, input: { method: 'bank' | 'upi' | 'wallet'; amount?: number; accountDetails?: Record<string, unknown> }) {
    return payoutService.createPayout(ownerId, input);
  }
}

export default new PaymentService();

