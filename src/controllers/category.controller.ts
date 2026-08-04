import { Response } from 'express';
import CategoryService from '../services/category.service';
import ApiResponse from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export class CategoryController {
  createCategory = asyncHandler(async (req: any, res: Response) => {
    const category = await CategoryService.createCategory(req.body);
    res.status(201).json(ApiResponse.ok(category, 'Category created'));
  });

  updateCategory = asyncHandler(async (req: any, res: Response) => {
    const category = await CategoryService.updateCategory(req.params.id, req.body);
    res.status(200).json(ApiResponse.ok(category, 'Category updated'));
  });

  deleteCategory = asyncHandler(async (req: any, res: Response) => {
    await CategoryService.deleteCategory(req.params.id);
    res.status(200).json(ApiResponse.ok(null, 'Category deleted'));
  });

  listCategories = asyncHandler(async (req: any, res: Response) => {
    const includeInactive = req.query.includeInactive === 'true';
    const categories = await CategoryService.listCategories(includeInactive);
    res.status(200).json(ApiResponse.ok(categories));
  });

  getBySlug = asyncHandler(async (req: any, res: Response) => {
    const category = await CategoryService.getBySlug(req.params.slug);
    res.status(200).json(ApiResponse.ok(category));
  });
}

export default new CategoryController();

