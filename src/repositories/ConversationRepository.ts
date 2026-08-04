import { PopulateOptions, Types } from 'mongoose';
import Conversation, { IConversation } from '../models/Conversation';
import BaseRepository from './BaseRepository';

const conversationPopulate: PopulateOptions[] = [
  { path: 'participants', select: 'name avatar email role' },
  { path: 'product', select: 'title slug images' },
  { path: 'lastMessage', select: 'content createdAt read sender' },
];

class ConversationRepository extends BaseRepository<IConversation> {
  constructor() {
    super(Conversation);
  }

  async findBetweenUsers(userA: string, userB: string): Promise<IConversation | null> {
    return Conversation.findOne({
      participants: { $all: [userA, userB] },
    })
      .populate(conversationPopulate)
      .exec();
  }

  async findByIdPopulated(id: string): Promise<IConversation | null> {
    return Conversation.findById(id).populate(conversationPopulate).exec();
  }

  async listForUser(userId: string): Promise<IConversation[]> {
    return this.find(
      { participants: userId as unknown as Types.ObjectId },
      { populate: conversationPopulate, sort: { lastMessageAt: -1 as 1 | -1 } }
    );
  }
}

export default new ConversationRepository();

