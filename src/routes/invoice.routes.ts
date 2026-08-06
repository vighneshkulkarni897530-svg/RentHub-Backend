import { Router } from 'express';
import InvoiceController from '../controllers/invoice.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { invoiceIdParamsSchema, createInvoiceSchema, listInvoicesQuerySchema } from '../validators/invoice';

const router = Router();

router.use(authenticate);

router.get('/', validate({ query: listInvoicesQuerySchema }), InvoiceController.getInvoices);
router.post('/', validate({ body: createInvoiceSchema }), InvoiceController.createInvoice);
router.get('/:id', validate({ params: invoiceIdParamsSchema }), InvoiceController.getInvoice);

export default router;
