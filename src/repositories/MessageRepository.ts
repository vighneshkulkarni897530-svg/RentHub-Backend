import { PopulateOptions, Types } from 'mongoose';
import Message, { IMessage } from '../models/Message';
import BaseRepository from './BaseRepository';

const messagePopulate: PopulateOptions[] = [{ path: 'sender', select: 'name avatar role' }];

class MessageRepository extends BaseRepository<IMessage> {
  constructor() {
    super(Message);
  }

  async findByConversation(conversationId: string, options: { page?: number; limit?: number }) {
    const page = options.page || 1;
    const limit = options.limit || 50;
    const skip = (page - 1) * limit;
    const filter = { conversation: conversationId as unknown as Types.ObjectId };
    const total = await this.countDocuments(filter);
    const data = await this.find(filter, {
      populate: messagePopulate,
      sort: { createdAt: 1 as 1 | -1 },
      skip,
      limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async markConversationAsRead(conversationId: string, userId: string): Promise<void> {
    await Message.updateMany(
      { conversation: conversationId, receiver: userId, read: false },
      { $set: { read: true, readAt: new Date() } }
    ).exec();
  }

  async unreadCount(userId: string): Promise<number> {
    return this.countDocuments({ receiver: userId as unknown as Types.ObjectId, read: false });
  }
}

export default new MessageRepository();

