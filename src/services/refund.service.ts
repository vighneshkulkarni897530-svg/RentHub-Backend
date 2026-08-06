import ApiError from '../utils/ApiError';
import RefundRepository from '../repositories/RefundRepository';
import PaymentRepository from '../repositories/PaymentRepository';
import BookingRepository from '../repositories/BookingRepository';
import UserRepository from '../repositories/UserRepository';
import notificationService from './notification.service';
import emailService from './email.service';
import { razorpayInstance, isConfigured } from '../config/razorpay';

// ============================================================
// RentHub - Refund Service
// ============================================================
// Complete refund workflow: initiate → process via Razorpay
// or wallet → mark payment/booking as refunded → notify user.
// ============================================================

function resolvePaymentId(refund: any): string {
  return refund.payment?._id?.toString?.() || refund.payment?.toString?.() || '';
}

export class RefundService {
  /**
   * Initiate a refund for a payment.
   * method: 'original' (Razorpay) or 'wallet' (credit wallet).
   */
  async initiateRefund(input: {
    paymentId: string;
    amount?: number;
    reason?: string;
    method?: 'original' | 'wallet';
    initiatedBy: string;
  }) {
    const payment = await PaymentRepository.findById(input.paymentId);
    if (!payment) throw new ApiError(404, 'Payment not found');
    if (payment.status !== 'completed') {
      throw new ApiError(400, 'Only completed payments can be refunded');
    }

    const amount = input.amount || payment.amount;
    if (amount <= 0 || amount > payment.amount) {
      throw new ApiError(400, 'Invalid refund amount');
    }

    const refund = await RefundRepository.create({
      refundId: `REF-${Date.now().toString(36).toUpperCase()}`,
      booking: payment.booking as any,
      payment: payment._id as any,
      user: payment.user as any,
      owner: payment.owner as any,
      amount,
      status: 'pending',
      method: input.method || 'original',
      reason: input.reason || 'Refund requested',
      initiatedBy: input.initiatedBy as any,
    });

    // Process the refund asynchronously
    void this.processRefund(refund.id as unknown as string);

    return refund;
  }

  /**
   * Process a pending refund (Razorpay refund or wallet credit).
   */
  async processRefund(refundId: string) {
    const refund = await RefundRepository.findById(refundId);
    if (!refund) return;
    if (refund.status !== 'pending') return;

    await RefundRepository.updateById(refundId, { status: 'processing' });

    try {
      let razorpayRefundId: string | undefined;
      const paymentId = resolvePaymentId(refund);

      if (refund.method === 'original' && isConfigured && razorpayInstance) {
        const result = await razorpayInstance.payments.refund(paymentId, {
          amount: Math.round(refund.amount * 100),
        });
        razorpayRefundId = result.id;
      } else {
        // Wallet credit fallback
        await UserRepository.updateById(refund.user.toString(), {
          $inc: { 'wallet.refundBalance': refund.amount },
          $push: {
            'wallet.transactions': {
              type: 'refund',
              amount: refund.amount,
              status: 'completed',
              description: `Refund for ${refund.refundId}`,
              reference: refund.refundId,
              createdAt: new Date(),
            },
          },
        });
      }

      await RefundRepository.updateById(refundId, {
        status: 'completed',
        razorpayRefundId,
        processedAt: new Date(),
      });

      // Mark payment + booking as refunded
      await PaymentRepository.updateById(refund.payment.toString(), { status: 'refunded' });
      await BookingRepository.updateById(refund.booking.toString(), { paymentStatus: 'refunded' });

      // Notify user + send email
      void notificationService.notifyRefund({
        userId: refund.user.toString(),
        title: 'Refund processed',
        message: `Your refund of ₹${refund.amount} has been processed.`,
        link: '/customer/wallet',
      });

      const user = await UserRepository.findById(refund.user.toString());
      if (user) {
        void emailService.sendRefundEmail(user.email, user.name, {
          amount: refund.amount,
          refundId: refund.refundId,
          status: 'Completed',
        });
      }
    } catch (error) {
      await RefundRepository.updateById(refundId, {
        status: 'failed',
        failureReason: (error as Error).message,
      });
    }
  }

  async listRefunds(userId: string, role: string, options: any) {
    if (role === 'admin') return RefundRepository.listAll(options);
    if (role === 'owner') return RefundRepository.listForOwner(userId, options);
    return RefundRepository.listForUser(userId, options);
  }

  async getRefund(id: string, userId: string, role: string) {
    const refund = await RefundRepository.findByIdPopulated(id);
    if (!refund) throw new ApiError(404, 'Refund not found');
    if (refund.user.toString() !== userId && refund.owner.toString() !== userId && role !== 'admin') {
      throw new ApiError(403, 'You do not have access to this refund');
    }
    return refund;
  }
}

export default new RefundService();
