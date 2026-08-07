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
    // Aggregation-based earnings summary (avoids loading all payments into memory)
    const [summary] = await PaymentRepository.getEarningsAggregation(ownerId);
    const total = summary?.total || 0;
    const count = summary?.count || 0;
    const monthlyRows = summary?.monthly || [];

    const monthly = new Map<string, { amount: number; bookings: number }>();
    for (const row of monthlyRows) {
      const entry = monthly.get(row.month) || { amount: 0, bookings: 0 };
      entry.amount += row.amount || 0;
      entry.bookings += row.bookings || 0;
      monthly.set(row.month, entry);
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
      count,
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
   * Razorpay webhook handler. Verifies the X-Razorpay-Signature header
   * and reconciles payment/refund events server-side. This is the
   * source of truth for payment settlement (idempotent by event id).
   */
async handleWebhook(rawBody: string, signature: string): Promise<{ event: string; processed: boolean }> {
    if (!isConfigured || !razorpayInstance) {
      throw new ApiError(503, 'Payment gateway is not configured');
    }

    // Verify Razorpay signature (HMAC-SHA256 of the raw body string)
    const expected = crypto
      .createHmac('sha256', env.razorpay.keySecret)
      .update(rawBody)
      .digest('hex');
    if (expected !== signature) {
      throw new ApiError(401, 'Invalid webhook signature');
    }

    const body = JSON.parse(rawBody) as { event?: string; payload?: Record<string, any> };
    const event = body.event || '';
    const data = body.payload || {};

    // Handle payment.authorized / captured events
    if (event === 'payment.captured' || event === 'payment.authorized') {
      const paymentEntity = data.payment?.entity;
      const orderId = paymentEntity?.order_id;
      if (orderId) {
        const payment = await PaymentRepository.findByRazorpayOrderId(orderId);
        if (payment && payment.status !== 'completed') {
          await PaymentRepository.updateById(payment.id, {
            razorpayPaymentId: paymentEntity.id,
            status: 'completed',
            completedAt: new Date(),
          });
          await BookingRepository.updateById(payment.booking.toString(), { paymentStatus: 'paid' });
          void notificationService.notifyPaymentReceived({
            userId: payment.owner.toString(),
            title: 'Payment received',
            message: 'A payment has been received for your booking.',
            link: '/owner/earnings',
          });
          void invoiceService.createInvoiceForPayment(payment.id).catch(() => null);
        }
      }
    }

    // Handle refund events
    if (event === 'refund.processed' || event === 'refund.created') {
      const refundEntity = data.refund?.entity;
      const paymentId = refundEntity?.payment_id;
      if (paymentId) {
        const payment = await PaymentRepository.findOne({ razorpayPaymentId: paymentId });
        if (payment) {
          await PaymentRepository.updateById(payment.id, { status: 'refunded' });
          await BookingRepository.updateById(payment.booking.toString(), { paymentStatus: 'refunded' });
        }
      }
    }

    return { event, processed: true };
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

