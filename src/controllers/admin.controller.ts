import { Response } from 'express';
import AdminService from '../services/admin.service';
import OwnerService from '../services/owner.service';
import ApiResponse from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middleware/auth';

export class AdminController {
  getDashboardStats = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const stats = await AdminService.getDashboardStats();
    res.status(200).json(ApiResponse.ok(stats));
  });

  listUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await AdminService.listUsers(req.query);
    res.status(200).json(ApiResponse.ok(result));
  });

  updateUserStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await AdminService.updateUserStatus(req.params.id, req.body.status);
    res.status(200).json(ApiResponse.ok(user, 'User status updated'));
  });

  listProducts = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await AdminService.listProducts(req.query);
    res.status(200).json(ApiResponse.ok(result));
  });

  moderateProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
    const product = await AdminService.moderateProduct(req.params.id, req.body.status);
    res.status(200).json(ApiResponse.ok(product, 'Product moderation updated'));
  });

  listBookings = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await AdminService.listBookings(req.query);
    res.status(200).json(ApiResponse.ok(result));
  });

  listPayments = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await AdminService.listPayments(req.query);
    res.status(200).json(ApiResponse.ok(result));
  });

  listCategories = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const categories = await AdminService.listCategories();
    res.status(200).json(ApiResponse.ok(categories));
  });

  updateCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const category = await AdminService.updateCategory(req.params.id, req.body);
    res.status(200).json(ApiResponse.ok(category, 'Category updated'));
  });

  listReports = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await AdminService.listReports(req.query);
    res.status(200).json(ApiResponse.ok(result));
  });

  listSupportTickets = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await AdminService.listSupportTickets(req.query);
    res.status(200).json(ApiResponse.ok(result));
  });

  listVerifications = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await AdminService.listVerifications(req.query);
    res.status(200).json(ApiResponse.ok(result));
  });

  reviewVerification = asyncHandler(async (req: AuthRequest, res: Response) => {
    const updated = await OwnerService.reviewVerification(
      req.params.id,
      req.user!.id,
      req.body.status,
      req.body.note
    );
    res.status(200).json(ApiResponse.ok(updated, 'Verification reviewed'));
  });

  getAnalytics = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const analytics = await AdminService.getAnalytics();
    res.status(200).json(ApiResponse.ok(analytics));
  });
}

export default new AdminController();

