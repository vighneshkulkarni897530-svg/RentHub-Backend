// MessageService unit tests — repositories mocked via vi.mock

vi.mock('../../../src/repositories/ConversationRepository', () => ({
  default: {
    listForUser: vi.fn(),
    findById: vi.fn(),
    findByIdPopulated: vi.fn(),
    findBetweenUsers: vi.fn(),
    create: vi.fn(),
    updateById: vi.fn(),
  },
}));

vi.mock('../../../src/repositories/MessageRepository', () => ({
  default: {
    countDocuments: vi.fn(),
    markConversationAsRead: vi.fn(),
    findByConversation: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('../../../src/repositories/UserRepository', () => ({
  default: {
    findById: vi.fn(),
  },
}));

vi.mock('../../../src/repositories/ProductRepository', () => ({
  default: {
    findById: vi.fn(),
  },
}));

vi.mock('../../../src/services/notification.service', () => ({
  default: {
    createNotification: vi.fn().mockResolvedValue(undefined),
    notifyBookingCreated: vi.fn().mockResolvedValue(undefined),
    notifyPaymentReceived: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../../src/socket', () => ({
  default: { initSocket: vi.fn(), getIO: vi.fn(() => null) },
  initSocket: vi.fn(),
  getIO: vi.fn(() => null),
}));

import MessageService from '../../../src/services/message.service';
import ConversationRepository from '../../../src/repositories/ConversationRepository';
import MessageRepository from '../../../src/repositories/MessageRepository';
import UserRepository from '../../../src/repositories/UserRepository';

const mockConversation = {
  _id: 'conv1',
  participants: [{ _id: 'user1' }, { _id: 'user2' }],
  product: 'prod1',
  lastMessage: 'msg1',
  lastMessageAt: new Date(),
  status: 'active',
};

const mockMessage = { _id: 'msg1', conversation: 'conv1', sender: 'user1', receiver: 'user2', content: 'Hello', read: false, createdAt: new Date() };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('MessageService', () => {
  describe('getConversations', () => {
    it('returns enriched conversations', async () => {
      (ConversationRepository.listForUser as any).mockResolvedValue([mockConversation]);
      (MessageRepository.countDocuments as any).mockResolvedValue(0);
      const result = await MessageService.getConversations('user1');
      expect(result).toHaveLength(1);
      expect(result[0].unreadCount).toBe(0);
    });
  });

  describe('getMessages', () => {
    it('returns messages for participant', async () => {
      (ConversationRepository.findById as any).mockResolvedValue({
        _id: 'conv1',
        participants: [{ _id: 'user1' }, { _id: 'user2' }],
      });
      (MessageRepository.markConversationAsRead as any).mockResolvedValue({});
      (MessageRepository.findByConversation as any).mockResolvedValue([mockMessage]);
      const result = await MessageService.getMessages('conv1', 'user1', {});
      expect(result).toEqual([mockMessage]);
    });

    it('throws 404 when conversation not found', async () => {
      (ConversationRepository.findById as any).mockResolvedValue(null);
      await expect(MessageService.getMessages('conv1', 'user1', {})).rejects.toMatchObject({ statusCode: 404 });
    });

    it('throws 403 when not participant', async () => {
      (ConversationRepository.findById as any).mockResolvedValue({
        _id: 'conv1',
        participants: [{ _id: 'user3' }, { _id: 'user4' }],
      });
      await expect(MessageService.getMessages('conv1', 'user1', {})).rejects.toMatchObject({ statusCode: 403 });
    });
  });

  describe('sendMessage', () => {
    it('sends message in existing conversation', async () => {
      (UserRepository.findById as any).mockResolvedValue({ id: 'user2', _id: 'user2' });
      (ConversationRepository.findByIdPopulated as any).mockResolvedValue({
        _id: 'conv1',
        participants: [{ _id: 'user1' }, { _id: 'user2' }],
      });
      (MessageRepository.create as any).mockResolvedValue(mockMessage);
      (ConversationRepository.updateById as any).mockResolvedValue({});
      const result = await MessageService.sendMessage('user1', {
        receiver: 'user2',
        conversationId: 'conv1',
        content: 'Hello',
      });
      expect(result).toBeDefined();
    });

    it('throws 404 when receiver not found', async () => {
      (UserRepository.findById as any).mockResolvedValue(null);
      await expect(
        MessageService.sendMessage('user1', { receiver: 'user2', content: 'Hello' })
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('throws 400 when messaging self', async () => {
      (UserRepository.findById as any).mockResolvedValue({ id: 'user1', _id: 'user1' });
      await expect(
        MessageService.sendMessage('user1', { receiver: 'user1', content: 'Hello' })
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('markConversationRead', () => {
    it('marks conversation as read', async () => {
      (MessageRepository.markConversationAsRead as any).mockResolvedValue({});
      await MessageService.markConversationRead('conv1', 'user1');
      expect(MessageRepository.markConversationAsRead).toHaveBeenCalledWith('conv1', 'user1');
    });
  });
});
