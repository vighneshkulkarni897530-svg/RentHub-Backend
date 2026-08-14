import { Response } from 'express';
import PurchaseService from '../services/purchase.service';
import ApiResponse from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middleware/auth';

export class PurchaseController {
  // ============================================================
  // Purchase Requests
  // ============================================================

  createPurchaseRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
    const request = await PurchaseService.createPurchaseRequest(req.user!.id, req.body);
    res.status(201).json(ApiResponse.ok(request, 'Purchase request sent to owner'));
  });

  getMyPurchaseRequests = asyncHandler(async (req: AuthRequest, res: Response) => {
    const requests = await PurchaseService.listMyPurchaseRequests(req.user!.id, {
      page: (req.query.page as any) || 1,
      limit: (req.query.limit as any) || 20,
      status: req.query.status as string | undefined,
    });
    res.status(200).json(ApiResponse.ok(requests));
  });

  getOwnerPurchaseRequests = asyncHandler(async (req: AuthRequest, res: Response) => {
    const requests = await PurchaseService.listOwnerPurchaseRequests(req.user!.id, {
      page: (req.query.page as any) || 1,
      limit: (req.query.limit as any) || 20,
      status: req.query.status as string | undefined,
    });
    res.status(200).json(ApiResponse.ok(requests));
  });

  getPurchaseRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
    const request = await PurchaseService.getPurchaseRequest(req.params.id, req.user!.id);
    res.status(200).json(ApiResponse.ok(request));
  });

  acceptPurchaseRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
    const request = await PurchaseService.acceptPurchaseRequest(req.params.id, req.user!.id);
    res.status(200).json(ApiResponse.ok(request, 'Purchase request accepted'));
  });

  rejectPurchaseRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
    const request = await PurchaseService.rejectPurchaseRequest(req.params.id, req.user!.id, req.body?.reason);
    res.status(200).json(ApiResponse.ok(request, 'Purchase request rejected'));
  });

  // ============================================================
  // Purchases
  // ============================================================

  createPurchase = asyncHandler(async (req: AuthRequest, res: Response) => {
    const purchase = await PurchaseService.createPurchase(req.user!.id, req.body);
    res.status(201).json(ApiResponse.ok(purchase, 'Purchase created'));
  });

  confirmPurchase = asyncHandler(async (req: AuthRequest, res: Response) => {
    const purchase = await PurchaseService.confirmPurchase(req.params.id, req.user!.id);
    res.status(200).json(ApiResponse.ok(purchase, 'Purchase confirmed'));
  });

  getMyPurchases = asyncHandler(async (req: AuthRequest, res: Response) => {
    const purchases = await PurchaseService.listMyPurchases(req.user!.id, {
      page: (req.query.page as any) || 1,
      limit: (req.query.limit as any) || 20,
      status: req.query.status as string | undefined,
    });
    res.status(200).json(ApiResponse.ok(purchases));
  });

  getOwnerSales = asyncHandler(async (req: AuthRequest, res: Response) => {
    const sales = await PurchaseService.listOwnerSales(req.user!.id, {
      page: (req.query.page as any) || 1,
      limit: (req.query.limit as any) || 20,
      status: req.query.status as string | undefined,
    });
    res.status(200).json(ApiResponse.ok(sales));
  });

  getPurchase = asyncHandler(async (req: AuthRequest, res: Response) => {
    const purchase = await PurchaseService.getPurchase(req.params.id, req.user!.id);
    res.status(200).json(ApiResponse.ok(purchase));
  });
}

export default new PurchaseController();