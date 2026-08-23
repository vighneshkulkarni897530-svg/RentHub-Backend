import { Router } from 'express';
import ProductController from '../controllers/product.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { upload } from '../middleware/upload';
import {
  createProductSchema,
  updateProductSchema,
  productIdParamsSchema,
  productSlugParamsSchema,
  listProductsQuerySchema,
  availabilityBlockSchema,
} from '../validators/product';

const router = Router();

// Public routes
router.get('/', validate({ query: listProductsQuerySchema }), ProductController.listProducts);
router.get('/slug/:slug', validate({ params: productSlugParamsSchema }), ProductController.getProductBySlug);

// Protected: owner's own listings — must be defined BEFORE '/:id' so 'my'
// is not captured by the ':id' param (which would reject 'my' as an ObjectId).
router.get('/my', authenticate, ProductController.getOwnerProducts);

// Public-by-id routes (kept public — only '/my' requires auth)
router.get('/:id', validate({ params: productIdParamsSchema }), ProductController.getProductById);
router.get('/:id/availability', validate({ params: productIdParamsSchema }), ProductController.getAvailability);

// Protected routes (owner/admin)
router.use(authenticate);
router.post(
  '/',
  authorize('owner', 'admin'),
  upload.array('images', 10),
  validate({ body: createProductSchema }),
  ProductController.createProduct
);
router.put(
  '/:id',
  authorize('owner', 'admin'),
  validate({ params: productIdParamsSchema, body: updateProductSchema }),
  ProductController.updateProduct
);
router.delete(
  '/:id',
  authorize('owner', 'admin'),
  validate({ params: productIdParamsSchema }),
  ProductController.deleteProduct
);

// Availability management
router.post(
  '/:id/block',
  authorize('owner', 'admin'),
  validate({ params: productIdParamsSchema, body: availabilityBlockSchema }),
  ProductController.blockDates
);
router.delete(
  '/:id/block/:blockId',
  authorize('owner', 'admin'),
  ProductController.removeBlock
);

export default router;