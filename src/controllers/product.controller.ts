import { Response } from 'express';
import ProductService from '../services/product.service';
import UploadService from '../services/upload.service';
import ApiResponse from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middleware/auth';

export class ProductController {
  createProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
    let imageUrls: string[] = [];
    const files = (req as any).files as Express.Multer.File[] | undefined;
    if (files && files.length) {
      const uploads = await UploadService.uploadMultiple(files, 'renthub/products');
      imageUrls = uploads.map((u: any) => u.url).filter(Boolean);
    }
    const product = await ProductService.createProduct(req.user!.id, req.body, imageUrls);
    res.status(201).json(ApiResponse.ok(product, 'Product created successfully'));
  });

  updateProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
    const product = await ProductService.updateProduct(req.params.id, req.user!.id, req.body);
    res.status(200).json(ApiResponse.ok(product, 'Product updated'));
  });

  deleteProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
    await ProductService.deleteProduct(req.params.id, req.user!.id);
    res.status(200).json(ApiResponse.ok(null, 'Product deleted'));
  });

  listProducts = asyncHandler(async (req: AuthRequest, res: Response) => {
    const products = await ProductService.listProducts(req.query);
    res.status(200).json(ApiResponse.ok(products));
  });

  getProductBySlug = asyncHandler(async (req: AuthRequest, res: Response) => {
    const product = await ProductService.getBySlug(req.params.slug);
    res.status(200).json(ApiResponse.ok(product));
  });

  getProductById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const product = await ProductService.getById(req.params.id);
    res.status(200).json(ApiResponse.ok(product));
  });

  getOwnerProducts = asyncHandler(async (req: AuthRequest, res: Response) => {
    const products = await ProductService.getOwnerProducts(req.user!.id);
    res.status(200).json(ApiResponse.ok(products));
  });

  blockDates = asyncHandler(async (req: AuthRequest, res: Response) => {
    const block = await ProductService.blockDates(req.params.id, req.user!.id, {
      reason: req.body.reason,
      startDate: new Date(req.body.startDate),
      endDate: new Date(req.body.endDate),
      note: req.body.note,
    });
    res.status(201).json(ApiResponse.ok(block, 'Dates blocked'));
  });

  getAvailability = asyncHandler(async (req: AuthRequest, res: Response) => {
    const availability = await ProductService.getAvailability(req.params.id);
    res.status(200).json(ApiResponse.ok(availability));
  });

  removeBlock = asyncHandler(async (req: AuthRequest, res: Response) => {
    await ProductService.removeBlock(req.params.blockId, req.user!.id);
    res.status(200).json(ApiResponse.ok(null, 'Blocked dates removed'));
  });
}

export default new ProductController();

