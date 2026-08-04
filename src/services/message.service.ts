import ApiError from '../utils/ApiError';
import ConversationRepository from '../repositories/ConversationRepository';
import MessageRepository from '../repositories/MessageRepository';
import UserRepository from '../repositories/UserRepository';
import ProductRepository from '../repositories/ProductRepository';
import notificationService from './notification.service';
import { getIO } from '../socket';
import { SendMessageInput } from '../validators/message';

export class MessageService {
  async getConversations(userId: string) {
    const conversations = await ConversationRepository.listForUser(userId);
    // Enrich with unread counts
    const enriched = await Promise.all(
      conversations.map(async (conv: any) => {
        const otherParticipants = conv.participants.filter(
          (p: any) => p._id.toString() !== userId
        );
        const other = otherParticipants[0];
        const unreadCount = await MessageRepository.countDocuments({
          conversation: conv._id,
          receiver: userId as any,
          read: false,
        });
        return {
          id: conv._id,
          participant: other,
          product: conv.product,
          lastMessage: conv.lastMessage,
          lastMessageAt: conv.lastMessageAt,
          unreadCount,
          status: conv.status,
        };
      })
    );
    return enriched;
  }

  async getMessages(conversationId: string, userId: string, options: any) {
    const conversation = await ConversationRepository.findById(conversationId);
    if (!conversation) throw new ApiError(404, 'Conversation not found');

    const isParticipant = conversation.participants.some(
      (p: any) => p._id.toString() === userId || p.toString() === userId
    );
    if (!isParticipant) throw new ApiError(403, 'You are not a participant of this conversation');

    // Mark messages as read
    await MessageRepository.markConversationAsRead(conversationId, userId);

    return MessageRepository.findByConversation(conversationId, options);
  }

  async sendMessage(userId: string, input: SendMessageInput) {
    const receiver = await UserRepository.findById(input.receiver);
    if (!receiver) throw new ApiError(404, 'Receiver not found');
    if (receiver.id === userId) throw new ApiError(400, 'You cannot message yourself');

    let conversation: any = null;

    if (input.conversationId) {
      conversation = await ConversationRepository.findByIdPopulated(input.conversationId);
      if (!conversation) throw new ApiError(404, 'Conversation not found');
      const isParticipant = conversation.participants.some(
        (p: any) => p._id.toString() === userId || p.toString() === userId
      );
      if (!isParticipant) throw new ApiError(403, 'You are not a participant of this conversation');
    } else {
      // Find or create a conversation between the two users
      conversation = await ConversationRepository.findBetweenUsers(userId, input.receiver);
      if (!conversation) {
        const conversationData: Record<string, unknown> = {
          participants: [userId, input.receiver],
        };
        if (input.product) {
          const product = await ProductRepository.findById(input.product);
          if (product) conversationData.product = product._id;
        }
        conversation = await ConversationRepository.create(conversationData as any);
      }
    }

    const message = await MessageRepository.create({
      conversation: conversation._id as any,
      sender: userId as any,
      receiver: input.receiver as any,
      content: input.content,
      read: false,
    });

    // Update conversation lastMessage
    await ConversationRepository.updateById(conversation._id.toString(), {
      lastMessage: message._id,
      lastMessageAt: new Date(),
    });

    // Real-time delivery
    const io = getIO();
    if (io) {
      io.to(`user:${input.receiver}`).emit('message:new', {
        conversationId: conversation._id,
        message: {
          id: message._id,
          sender: { _id: userId },
          receiver: input.receiver,
          content: input.content,
          createdAt: (message as any).createdAt,
          read: false,
        },
      });
      io.to(`conversation:${conversation._id}`).emit('message:new', message);
    }

    // Notification for offline/online user
    void notificationService.createNotification({
      userId: input.receiver,
      type: 'message',
      title: 'New message',
      message: 'You have a new message',
      link: '/dashboard/messages',
    });

    return message;
  }

  async markConversationRead(conversationId: string, userId: string): Promise<void> {
    await MessageRepository.markConversationAsRead(conversationId, userId);
  }
}

export default new MessageService();

