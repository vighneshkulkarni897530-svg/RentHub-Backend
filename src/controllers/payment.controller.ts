import { Request, Response } from 'express';
import PaymentService from '../services/payment.service';
import ApiResponse from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middleware/auth';

export class PaymentController {
  createOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
    const order = await PaymentService.createOrder(req.body.bookingId, req.user!.id);
    res.status(201).json(ApiResponse.ok(order, 'Payment order created'));
  });

  verifyPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
    const payment = await PaymentService.verifyPayment(req.body, req.user!.id);
    res.status(200).json(ApiResponse.ok(payment, 'Payment verified successfully'));
  });

  getPayments = asyncHandler(async (req: AuthRequest, res: Response) => {
    const payments = await PaymentService.getPayments(req.user!.id, req.user!.role, {
      page: (req.query.page as any) || 1,
      limit: (req.query.limit as any) || 20,
      status: req.query.status as string | undefined,
    });
    res.status(200).json(ApiResponse.ok(payments));
  });

  getEarnings = asyncHandler(async (req: AuthRequest, res: Response) => {
    const earnings = await PaymentService.getEarnings(req.user!.id);
    res.status(200).json(ApiResponse.ok(earnings));
  });

/**
   * Razorpay webhook handler (no auth — signature verified in service).
   * Uses the raw body buffer (express.raw) for signature verification.
   */
  webhook = asyncHandler(async (req: Request, res: Response) => {
    const signature = req.get('X-Razorpay-Signature') || '';
    const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : JSON.stringify(req.body);
    const result = await PaymentService.handleWebhook(rawBody, signature);
    res.status(200).json(ApiResponse.ok(result, 'Webhook processed'));
  });
}

export default new PaymentController();
