import { Router } from 'express';
import SupportTicketController from '../controllers/supportTicket.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createSupportTicketSchema, updateTicketStatusSchema, addTicketMessageSchema, ticketIdParamsSchema } from '../validators/supportTicket';

const router = Router();

router.use(authenticate);

router.get('/my', SupportTicketController.getMyTickets);
router.post('/', validate({ body: createSupportTicketSchema }), SupportTicketController.createTicket);
router.get('/:id', validate({ params: ticketIdParamsSchema }), SupportTicketController.getTicketById);
router.put(
  '/:id/status',
  authorize('admin'),
  validate({ params: ticketIdParamsSchema, body: updateTicketStatusSchema }),
  SupportTicketController.updateStatus
);
router.put(
  '/:id/message',
  validate({ params: ticketIdParamsSchema, body: addTicketMessageSchema }),
  SupportTicketController.addMessage
);

export default router;

