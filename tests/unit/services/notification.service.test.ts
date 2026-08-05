// NotificationService unit tests — repositories mocked via vi.mock

vi.mock('../../../src/repositories/NotificationRepository', () => ({
  default: {
    createForUser: vi.fn(),
  },
}));

vi.mock('../../../src/socket', () => ({
  default: { initSocket: vi.fn(), getIO: vi.fn(() => null) },
  initSocket: vi.fn(),
  getIO: vi.fn(() => null),
}));

import { createNotification, notifyBookingCreated, notifyPaymentReceived } from '../../../src/services/notification.service';
import NotificationRepository from '../../../src/repositories/NotificationRepository';

const mockNotification = { _id: 'n1', type: 'system', title: 'Hi', message: 'Hello', link: '/', read: false, createdAt: new Date() };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('NotificationService', () => {
  describe('createNotification', () => {
    it('creates a notification', async () => {
      (NotificationRepository.createForUser as any).mockResolvedValue(mockNotification);
      await createNotification({ userId: 'user1', type: 'system', title: 'Hi', message: 'Hello' });
      expect(NotificationRepository.createForUser).toHaveBeenCalled();
    });
  });

  describe('notifyBookingCreated', () => {
    it('creates a booking notification', async () => {
      (NotificationRepository.createForUser as any).mockResolvedValue(mockNotification);
      await notifyBookingCreated({ userId: 'owner1', title: 'New booking', message: 'You have a booking' });
      expect(NotificationRepository.createForUser).toHaveBeenCalledWith(
        'owner1',
        expect.objectContaining({ type: 'booking' })
      );
    });
  });

  describe('notifyPaymentReceived', () => {
    it('creates a payment notification', async () => {
      (NotificationRepository.createForUser as any).mockResolvedValue(mockNotification);
      await notifyPaymentReceived({ userId: 'owner1', title: 'Payment', message: 'Payment received' });
      expect(NotificationRepository.createForUser).toHaveBeenCalledWith(
        'owner1',
        expect.objectContaining({ type: 'payment' })
      );
    });
  });
});
