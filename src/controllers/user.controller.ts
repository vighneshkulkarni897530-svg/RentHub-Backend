import { Response } from 'express';
import UserService from '../services/user.service';
import ApiResponse from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middleware/auth';

export class UserController {
  getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await UserService.getUserById(req.user!.id);
    res.status(200).json(ApiResponse.ok(user));
  });

  updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await UserService.updateProfile(req.user!.id, req.body);
    res.status(200).json(ApiResponse.ok(user, 'Profile updated successfully'));
  });

  getUserById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await UserService.getUserById(req.params.id);
    res.status(200).json(ApiResponse.ok(user));
  });

  getDashboardStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const stats = await UserService.getDashboardStats(req.user!.id, req.params.role || req.user!.role);
    res.status(200).json(ApiResponse.ok(stats));
  });

  // --- Wishlist ---
  getWishlist = asyncHandler(async (req: AuthRequest, res: Response) => {
    const wishlist = await UserService.getWishlist(req.user!.id);
    res.status(200).json(ApiResponse.ok(wishlist));
  });

  addToWishlist = asyncHandler(async (req: AuthRequest, res: Response) => {
    const wishlist = await UserService.addToWishlist(req.user!.id, req.params.productId);
    res.status(200).json(ApiResponse.ok(wishlist, 'Added to wishlist'));
  });

  removeFromWishlist = asyncHandler(async (req: AuthRequest, res: Response) => {
    const wishlist = await UserService.removeFromWishlist(req.user!.id, req.params.productId);
    res.status(200).json(ApiResponse.ok(wishlist, 'Removed from wishlist'));
  });
}

export default new UserController();

