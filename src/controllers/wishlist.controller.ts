import { Response } from 'express';
import WishlistService from '../services/wishlist.service';
import ApiResponse from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middleware/auth';

export class WishlistController {
  getWishlist = asyncHandler(async (req: AuthRequest, res: Response) => {
    const wishlist = await WishlistService.getWishlist(req.user!.id);
    res.status(200).json(ApiResponse.ok(wishlist));
  });

  addProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
    const wishlist = await WishlistService.addProduct(req.user!.id, req.params.productId);
    res.status(200).json(ApiResponse.ok(wishlist, 'Added to wishlist'));
  });

  removeProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
    const wishlist = await WishlistService.removeProduct(req.user!.id, req.params.productId);
    res.status(200).json(ApiResponse.ok(wishlist, 'Removed from wishlist'));
  });

  checkWishlist = asyncHandler(async (req: AuthRequest, res: Response) => {
    const inWishlist = await WishlistService.isInWishlist(req.user!.id, req.params.productId);
    res.status(200).json(ApiResponse.ok({ inWishlist }));
  });
}

export default new WishlistController();

