// NotificationPreferenceService unit tests — repository mocked via vi.mock

vi.mock('../../../src/repositories/NotificationPreferenceRepository', () => ({
  default: {
    findByUser: vi.fn(),
    create: vi.fn(),
    upsertByUser: vi.fn(),
  },
}));

import NotificationPreferenceService from '../../../src/services/notificationPreferences.service';
import NotificationPreferenceRepository from '../../../src/repositories/NotificationPreferenceRepository';

const mockPrefs = {
  user: 'user1',
  categories: {
    booking: [
      { channel: 'push', enabled: true },
      { channel: 'email', enabled: false },
      { channel: 'sms', enabled: true },
      { channel: 'in_app', enabled: true },
    ],
  },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('NotificationPreferenceService', () => {
  describe('getPreferences', () => {
    it('returns existing preferences', async () => {
      (NotificationPreferenceRepository.findByUser as any).mockResolvedValue(mockPrefs);
      const result = await NotificationPreferenceService.getPreferences('user1');
      expect(result).toEqual(mockPrefs);
      expect(NotificationPreferenceRepository.create).not.toHaveBeenCalled();
    });

    it('creates default preferences when none exist', async () => {
      (NotificationPreferenceRepository.findByUser as any).mockResolvedValue(null);
      (NotificationPreferenceRepository.create as any).mockResolvedValue(mockPrefs);
      const result = await NotificationPreferenceService.getPreferences('user1');
      expect(result).toEqual(mockPrefs);
      expect(NotificationPreferenceRepository.create).toHaveBeenCalled();
    });
  });

  describe('updatePreferences', () => {
    it('updates preferences', async () => {
      (NotificationPreferenceRepository.upsertByUser as any).mockResolvedValue(mockPrefs);
      const result = await NotificationPreferenceService.updatePreferences('user1', {
        booking: [{ channel: 'email', enabled: false }],
      });
      expect(result).toEqual(mockPrefs);
      expect(NotificationPreferenceRepository.upsertByUser).toHaveBeenCalled();
    });

    it('throws 400 for invalid payload', async () => {
      await expect(
        NotificationPreferenceService.updatePreferences('user1', null as any)
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('throws 400 when category is not an array', async () => {
      await expect(
        NotificationPreferenceService.updatePreferences('user1', { booking: 'not-array' as any })
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('isChannelEnabled', () => {
    it('returns true when no preferences exist (default)', async () => {
      (NotificationPreferenceRepository.findByUser as any).mockResolvedValue(null);
      const result = await NotificationPreferenceService.isChannelEnabled('user1', 'booking', 'email');
      expect(result).toBe(true);
    });

    it('returns false when channel disabled', async () => {
      (NotificationPreferenceRepository.findByUser as any).mockResolvedValue(mockPrefs);
      const result = await NotificationPreferenceService.isChannelEnabled('user1', 'booking', 'email');
      expect(result).toBe(false);
    });

    it('returns true when channel enabled', async () => {
      (NotificationPreferenceRepository.findByUser as any).mockResolvedValue(mockPrefs);
      const result = await NotificationPreferenceService.isChannelEnabled('user1', 'booking', 'push');
      expect(result).toBe(true);
    });
  });
});
