import { Response } from 'express';
import InvoiceService from '../services/invoice.service';
import ApiResponse from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middleware/auth';

export class InvoiceController {
  createInvoice = asyncHandler(async (req: AuthRequest, res: Response) => {
    const invoice = await InvoiceService.createInvoiceForPayment(req.body.paymentId);
    res.status(201).json(ApiResponse.ok(invoice, 'Invoice generated'));
  });

  getInvoices = asyncHandler(async (req: AuthRequest, res: Response) => {
    const invoices = await InvoiceService.listInvoices(req.user!.id, req.user!.role, {
      page: (req.query.page as any) || 1,
      limit: (req.query.limit as any) || 20,
    });
    res.status(200).json(ApiResponse.ok(invoices));
  });

  getInvoice = asyncHandler(async (req: AuthRequest, res: Response) => {
    const invoice = await InvoiceService.getInvoice(req.params.id, req.user!.id, req.user!.role);
    res.status(200).json(ApiResponse.ok(invoice));
  });
}

export default new InvoiceController();
