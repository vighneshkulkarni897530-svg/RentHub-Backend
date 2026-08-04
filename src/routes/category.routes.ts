import { Router } from 'express';
import CategoryController from '../controllers/category.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createCategorySchema, updateCategorySchema, categorySlugParamsSchema, categoryIdParamsSchema } from '../validators/category';

const router = Router();

// Public
router.get('/', CategoryController.listCategories);
router.get('/:slug', validate({ params: categorySlugParamsSchema }), CategoryController.getBySlug);

// Admin only
router.post(
  '/',
  authenticate,
  authorize('admin'),
  validate({ body: createCategorySchema }),
  CategoryController.createCategory
);
router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  validate({ params: categoryIdParamsSchema, body: updateCategorySchema }),
  CategoryController.updateCategory
);
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  validate({ params: categoryIdParamsSchema }),
  CategoryController.deleteCategory
);

export default router;

