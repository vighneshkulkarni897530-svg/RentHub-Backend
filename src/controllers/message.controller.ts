import { Response } from 'express';
import MessageService from '../services/message.service';
import ApiResponse from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middleware/auth';

export class MessageController {
  getConversations = asyncHandler(async (req: AuthRequest, res: Response) => {
    const conversations = await MessageService.getConversations(req.user!.id);
    res.status(200).json(ApiResponse.ok(conversations));
  });

  getMessages = asyncHandler(async (req: AuthRequest, res: Response) => {
    const messages = await MessageService.getMessages(req.params.conversationId, req.user!.id, {
      page: (req.query.page as any) || 1,
      limit: (req.query.limit as any) || 50,
    });
    res.status(200).json(ApiResponse.ok(messages));
  });

  sendMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
    const message = await MessageService.sendMessage(req.user!.id, req.body);
    res.status(201).json(ApiResponse.ok(message, 'Message sent'));
  });

  markConversationRead = asyncHandler(async (req: AuthRequest, res: Response) => {
    await MessageService.markConversationRead(req.params.conversationId, req.user!.id);
    res.status(200).json(ApiResponse.ok(null, 'Marked as read'));
  });
}

export default new MessageController();

