import { Router } from 'express';
import PurchaseController from '../controllers/purchase.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createPurchaseRequestSchema,
  purchaseRequestIdParamsSchema,
  listPurchaseRequestsQuerySchema,
  createPurchaseSchema,
  purchaseIdParamsSchema,
  listPurchasesQuerySchema,
} from '../validators/purchase';

const router = Router();

router.use(authenticate);

// Purchase Requests - Renter
router.get('/requests/my', validate({ query: listPurchaseRequestsQuerySchema }), PurchaseController.getMyPurchaseRequests);

// Purchase Requests - Owner
router.get('/requests/owner', validate({ query: listPurchaseRequestsQuerySchema }), PurchaseController.getOwnerPurchaseRequests);

// Purchase Requests - Shared
router.post('/requests', validate({ body: createPurchaseRequestSchema }), PurchaseController.createPurchaseRequest);
router.get('/requests/:id', validate({ params: purchaseRequestIdParamsSchema }), PurchaseController.getPurchaseRequest);
router.patch('/requests/:id/accept', validate({ params: purchaseRequestIdParamsSchema }), PurchaseController.acceptPurchaseRequest);
router.patch('/requests/:id/reject', validate({ params: purchaseRequestIdParamsSchema }), PurchaseController.rejectPurchaseRequest);

// Purchases - Buyer
router.get('/my', validate({ query: listPurchasesQuerySchema }), PurchaseController.getMyPurchases);

// Purchases - Owner
router.get('/owner', validate({ query: listPurchasesQuerySchema }), PurchaseController.getOwnerSales);

// Purchases - Shared
router.post('/', validate({ body: createPurchaseSchema }), PurchaseController.createPurchase);
router.post('/:id/confirm', validate({ params: purchaseIdParamsSchema }), PurchaseController.confirmPurchase);
router.get('/:id', validate({ params: purchaseIdParamsSchema }), PurchaseController.getPurchase);

export default router;