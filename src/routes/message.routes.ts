import { Router } from 'express';
import MessageController from '../controllers/message.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { sendMessageSchema, conversationIdParamsSchema } from '../validators/message';

const router = Router();

router.use(authenticate);

router.get('/conversations', MessageController.getConversations);
router.get(
  '/conversation/:conversationId',
  validate({ params: conversationIdParamsSchema }),
  MessageController.getMessages
);
router.post('/', validate({ body: sendMessageSchema }), MessageController.sendMessage);
router.put(
  '/conversation/:conversationId/read',
  validate({ params: conversationIdParamsSchema }),
  MessageController.markConversationRead
);

export default router;

