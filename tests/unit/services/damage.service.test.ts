// DamageService unit tests — repositories mocked via vi.mock

vi.mock('../../../src/repositories/DamageReportRepository', () => ({
  default: {
    create: vi.fn(),
    findById: vi.fn(),
    updateById: vi.fn(),
    listForUser: vi.fn(),
    findByBooking: vi.fn(),
  },
}));

vi.mock('../../../src/repositories/BookingRepository', () => ({
  default: {
    findByIdPopulated: vi.fn(),
  },
}));

vi.mock('../../../src/services/notification.service', () => ({
  default: {
    createNotification: vi.fn().mockResolvedValue(undefined),
    notifyBookingCreated: vi.fn().mockResolvedValue(undefined),
    notifyPaymentReceived: vi.fn().mockResolvedValue(undefined),
  },
}));

import DamageService from '../../../src/services/damage.service';
import DamageReportRepository from '../../../src/repositories/DamageReportRepository';
import BookingRepository from '../../../src/repositories/BookingRepository';

const mockBooking = {
  id: 'book1',
  _id: 'book1',
  product: { _id: 'prod1' },
  owner: { _id: 'owner1' },
  renter: { _id: 'renter1' },
};

const mockReport = {
  id: 'dam1',
  _id: 'dam1',
  reporter: { toString: () => 'user1' },
  owner: { _id: 'owner1' },
  renter: { _id: 'renter1' },
  booking: 'book1',
  status: 'open',
  timeline: [],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('DamageService', () => {
  describe('createReport', () => {
    it('creates a damage report', async () => {
      (BookingRepository.findByIdPopulated as any).mockResolvedValue(mockBooking);
      (DamageReportRepository.create as any).mockResolvedValue(mockReport);
      const result = await DamageService.createReport('renter1', {
        bookingId: 'book1',
        stage: 'pickup',
        photos: [],
        videos: [],
        comments: 'scratched',
        chargeEstimate: 100,
        refundAmount: 0,
      });
      expect(result).toBeDefined();
      expect(DamageReportRepository.create).toHaveBeenCalled();
    });

    it('throws 404 when booking not found', async () => {
      (BookingRepository.findByIdPopulated as any).mockResolvedValue(null);
      await expect(
        DamageService.createReport('renter1', {
          bookingId: 'book1',
          stage: 'pickup',
          photos: [],
          videos: [],
          comments: 'x',
          chargeEstimate: 0,
          refundAmount: 0,
        })
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('throws 403 when not part of booking', async () => {
      (BookingRepository.findByIdPopulated as any).mockResolvedValue(mockBooking);
      await expect(
        DamageService.createReport('stranger', {
          bookingId: 'book1',
          stage: 'pickup',
          photos: [],
          videos: [],
          comments: 'x',
          chargeEstimate: 0,
          refundAmount: 0,
        })
      ).rejects.toMatchObject({ statusCode: 403 });
    });
  });

  describe('updateReport', () => {
    it('updates a damage report', async () => {
      (DamageReportRepository.findById as any).mockResolvedValue(mockReport);
      (DamageReportRepository.updateById as any).mockResolvedValue(mockReport);
      const result = await DamageService.updateReport('dam1', 'admin1', { status: 'resolved' });
      expect(result).toBeDefined();
      expect(DamageReportRepository.updateById).toHaveBeenCalled();
    });

    it('throws 404 when report not found', async () => {
      (DamageReportRepository.findById as any).mockResolvedValue(null);
      await expect(DamageService.updateReport('dam1', 'admin1', { status: 'resolved' })).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe('getMyReports', () => {
    it('lists reports for user', async () => {
      (DamageReportRepository.listForUser as any).mockResolvedValue([mockReport]);
      const result = await DamageService.getMyReports('user1');
      expect(result).toEqual([mockReport]);
    });
  });

  describe('getBookingReports', () => {
    it('filters reports for participant', async () => {
      (DamageReportRepository.findByBooking as any).mockResolvedValue([mockReport]);
      const result = await DamageService.getBookingReports('book1', 'owner1');
      expect(result).toHaveLength(1);
    });
  });
});
