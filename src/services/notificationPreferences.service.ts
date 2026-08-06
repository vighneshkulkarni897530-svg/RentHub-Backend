import NotificationPreferenceRepository from '../repositories/NotificationPreferenceRepository';
import ApiError from '../utils/ApiError';
import { IChannelSetting } from '../models/NotificationPreference';

// ============================================================
// RentHub - Notification Preferences Service
// ============================================================
// Per-user channel toggles grouped by notification category.
// ============================================================

const ALL_CATEGORIES = ['booking', 'payment', 'delivery', 'marketing', 'system', 'review'];
const ALL_CHANNELS = ['push', 'email', 'sms', 'in_app'];

export class NotificationPreferenceService {
  async getPreferences(userId: string) {
    const existing = await NotificationPreferenceRepository.findByUser(userId);
    if (existing) return existing;
    return NotificationPreferenceRepository.create({
      user: userId as any,
      categories: defaultCategories(),
    });
  }

  async updatePreferences(userId: string, categories: Record<string, unknown>) {
    if (!categories || typeof categories !== 'object') {
      throw new ApiError(400, 'Invalid preferences payload');
    }

    const normalized: Record<string, IChannelSetting[]> = {};
    for (const cat of ALL_CATEGORIES) {
      const setting = categories[cat];
      if (setting === undefined) continue;
      if (!Array.isArray(setting)) {
        throw new ApiError(400, `Invalid preferences for category "${cat}"`);
      }
      normalized[cat] = setting.map((s: any) => ({
        channel: s?.channel || 'in_app',
        enabled: s?.enabled !== false,
      }));
    }

    return NotificationPreferenceRepository.upsertByUser(userId, {
      ...defaultCategories(),
      ...normalized,
    });
  }

  async isChannelEnabled(userId: string, category: string, channel: string): Promise<boolean> {
    const prefs = await NotificationPreferenceRepository.findByUser(userId);
    if (!prefs) return true; // default: everything enabled
    const catSettings = (prefs.categories as any)?.[category];
    if (!catSettings) return true;
    const setting = catSettings.find((s: any) => s.channel === channel);
    return setting ? setting.enabled !== false : true;
  }
}

function defaultCategories(): Record<string, IChannelSetting[]> {
  const all: IChannelSetting[] = ALL_CHANNELS.map((channel) => ({ channel: channel as IChannelSetting['channel'], enabled: true }));
  const result: Record<string, IChannelSetting[]> = {};
  for (const cat of ALL_CATEGORIES) {
    result[cat] = all;
  }
  return result;
}

export default new NotificationPreferenceService();
