import { Response } from 'express';
import NotificationRepository from '../repositories/NotificationRepository';
import ApiResponse from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middleware/auth';

export class NotificationController {
  getNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
    const notifications = await NotificationRepository.listForUser(req.user!.id, {
      page: (req.query.page as any) || 1,
      limit: (req.query.limit as any) || 20,
      unreadOnly: req.query.unreadOnly === 'true',
    });
    res.status(200).json(ApiResponse.ok(notifications));
  });

  markAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
    const notification = await NotificationRepository.markAsRead(req.params.id, req.user!.id);
    res.status(200).json(ApiResponse.ok(notification, 'Notification marked as read'));
  });

  markAllAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
    await NotificationRepository.markAllAsRead(req.user!.id);
    res.status(200).json(ApiResponse.ok(null, 'All notifications marked as read'));
  });

  getUnreadCount = asyncHandler(async (req: AuthRequest, res: Response) => {
    const count = await NotificationRepository.unreadCount(req.user!.id);
    res.status(200).json(ApiResponse.ok({ count }));
  });
}

export default new NotificationController();

