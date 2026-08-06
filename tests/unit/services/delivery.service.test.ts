// DeliveryService unit tests — repositories mocked via vi.mock

vi.mock('../../../src/repositories/BookingRepository', () => ({
  default: {
    findByIdPopulated: vi.fn(),
    updateById: vi.fn(),
  },
}));

vi.mock('../../../src/repositories/DeliveryPartnerRepository', () => ({
  default: {
    create: vi.fn(),
    findById: vi.fn(),
    updateById: vi.fn(),
    listAll: vi.fn(),
    listAvailable: vi.fn(),
  },
}));

vi.mock('../../../src/services/notification.service', () => ({
  default: {
    notifyDelivery: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../../src/services/email.service', () => ({
  default: {
    sendDeliveryUpdateEmail: vi.fn().mockResolvedValue(undefined),
    sendOtpEmail: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../../src/services/sms.service', () => ({
  default: {
    sendSms: vi.fn().mockResolvedValue(undefined),
  },
}));

import DeliveryService from '../../../src/services/delivery.service';
import BookingRepository from '../../../src/repositories/BookingRepository';
import DeliveryPartnerRepository from '../../../src/repositories/DeliveryPartnerRepository';

const mockBooking = {
  _id: 'book1',
  id: 'book1',
  owner: { _id: 'owner1', name: 'Owner', email: 'owner@r.com' },
  renter: { _id: 'renter1', name: 'Renter', email: 'renter@r.com', phone: '9999999999' },
  deliveryStatus: 'pending',
  trackingTimeline: [],
  deliveryOtp: '',
};

const mockPartner = { _id: 'part1', name: 'Partner A', phone: '8888888888' };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('DeliveryService', () => {
  describe('createPartner', () => {
    it('creates a delivery partner', async () => {
      (DeliveryPartnerRepository.create as any).mockResolvedValue(mockPartner);
      const result = await DeliveryService.createPartner({ name: 'Partner A', phone: '8888888888' });
      expect(result).toEqual(mockPartner);
      expect(DeliveryPartnerRepository.create).toHaveBeenCalled();
    });
  });

  describe('listPartners', () => {
    it('admin lists all', async () => {
      (DeliveryPartnerRepository.listAll as any).mockResolvedValue([mockPartner]);
      const result = await DeliveryService.listPartners('admin', {});
      expect(result).toEqual([mockPartner]);
    });

    it('owner lists available', async () => {
      (DeliveryPartnerRepository.listAvailable as any).mockResolvedValue([mockPartner]);
      const result = await DeliveryService.listPartners('owner', {});
      expect(result).toEqual([mockPartner]);
    });
  });

  describe('assignPartner', () => {
    it('assigns a partner to a booking', async () => {
      (BookingRepository.findByIdPopulated as any).mockResolvedValue(mockBooking);
      (DeliveryPartnerRepository.findById as any).mockResolvedValue(mockPartner);
      (BookingRepository.updateById as any).mockResolvedValue(mockBooking);
      const result = await DeliveryService.assignPartner('book1', 'owner1', 'part1');
      expect(result).toBeDefined();
      expect(BookingRepository.updateById).toHaveBeenCalled();
    });

    it('throws 404 when booking not found', async () => {
      (BookingRepository.findByIdPopulated as any).mockResolvedValue(null);
      await expect(DeliveryService.assignPartner('book1', 'owner1', 'part1')).rejects.toMatchObject({ statusCode: 404 });
    });

    it('throws 403 when not owner', async () => {
      (BookingRepository.findByIdPopulated as any).mockResolvedValue(mockBooking);
      await expect(DeliveryService.assignPartner('book1', 'stranger', 'part1')).rejects.toMatchObject({ statusCode: 403 });
    });
  });

  describe('verifyOtp', () => {
    it('verifies OTP and marks delivered', async () => {
      (BookingRepository.findByIdPopulated as any).mockResolvedValue({ ...mockBooking, deliveryOtp: '123456' });
      (BookingRepository.updateById as any).mockResolvedValue(mockBooking);
      const result = await DeliveryService.verifyOtp('book1', 'renter1', '123456');
      expect(result).toBeDefined();
      expect(BookingRepository.updateById).toHaveBeenCalledWith(
        'book1',
        expect.objectContaining({ deliveryStatus: 'delivered' })
      );
    });

    it('throws 400 on invalid OTP', async () => {
      (BookingRepository.findByIdPopulated as any).mockResolvedValue({ ...mockBooking, deliveryOtp: '123456' });
      await expect(DeliveryService.verifyOtp('book1', 'renter1', '000000')).rejects.toMatchObject({ statusCode: 400 });
    });

    it('throws 403 when not renter', async () => {
      (BookingRepository.findByIdPopulated as any).mockResolvedValue({ ...mockBooking, deliveryOtp: '123456' });
      await expect(DeliveryService.verifyOtp('book1', 'stranger', '123456')).rejects.toMatchObject({ statusCode: 403 });
    });
  });

  describe('getTimeline', () => {
    it('returns the booking timeline', async () => {
      (BookingRepository.findByIdPopulated as any).mockResolvedValue(mockBooking);
      const result = await DeliveryService.getTimeline('book1', 'renter1');
      expect(result).toHaveProperty('deliveryStatus');
      expect(result).toHaveProperty('trackingTimeline');
    });
  });
});
