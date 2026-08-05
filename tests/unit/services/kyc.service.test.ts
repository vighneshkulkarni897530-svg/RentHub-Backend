// KycService unit tests — repositories mocked via vi.mock

vi.mock('../../../src/repositories/KycVerificationRepository', () => ({
  default: {
    findByUserId: vi.fn(),
    create: vi.fn(),
    updateById: vi.fn(),
    findById: vi.fn(),
    listAll: vi.fn(),
  },
}));

vi.mock('../../../src/repositories/UserRepository', () => ({
  default: {
    updateById: vi.fn(),
  },
}));

vi.mock('../../../src/services/notification.service', () => ({
  default: {
    createNotification: vi.fn().mockResolvedValue(undefined),
    notifyBookingCreated: vi.fn().mockResolvedValue(undefined),
    notifyPaymentReceived: vi.fn().mockResolvedValue(undefined),
  },
}));

import KycService from '../../../src/services/kyc.service';
import KycVerificationRepository from '../../../src/repositories/KycVerificationRepository';
import UserRepository from '../../../src/repositories/UserRepository';

const mockVerification = {
  id: 'kyc1',
  user: { toString: () => 'user1' },
  documentType: 'govt_id',
  documentUrls: ['url1'],
  status: 'pending',
  verifiedBadge: false,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('KycService', () => {
  describe('submitVerification', () => {
    it('throws 400 when no documents', async () => {
      await expect(
        KycService.submitVerification('user1', 'owner', { documentType: 'govt_id', documentUrls: [] })
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('throws 409 when verification already pending', async () => {
      (KycVerificationRepository.findByUserId as any).mockResolvedValue({ status: 'pending' });
      await expect(
        KycService.submitVerification('user1', 'owner', { documentType: 'govt_id', documentUrls: ['url'] })
      ).rejects.toMatchObject({ statusCode: 409 });
    });

it('creates new verification', async () => {
      (KycVerificationRepository.findByUserId as any)
        .mockResolvedValueOnce(null)
        .mockResolvedValue(mockVerification);
      (KycVerificationRepository.create as any).mockResolvedValue(mockVerification);
      (UserRepository.updateById as any).mockResolvedValue({});
      const result = await KycService.submitVerification('user1', 'owner', {
        documentType: 'govt_id',
        documentUrls: ['url'],
      });
      expect(result).toBeDefined();
      expect(UserRepository.updateById).toHaveBeenCalledWith('user1', expect.objectContaining({ kycStatus: 'pending' }));
    });

it('updates existing verification', async () => {
      const existingRejected = { ...mockVerification, status: 'rejected' };
      (KycVerificationRepository.findByUserId as any)
        .mockResolvedValueOnce(existingRejected)
        .mockResolvedValue(mockVerification);
      (KycVerificationRepository.updateById as any).mockResolvedValue(mockVerification);
      (UserRepository.updateById as any).mockResolvedValue({});
      const result = await KycService.submitVerification('user1', 'owner', {
        documentType: 'govt_id',
        documentUrls: ['url'],
      });
      expect(result).toBeDefined();
      expect(KycVerificationRepository.updateById).toHaveBeenCalled();
    });
  });

  describe('getVerificationStatus', () => {
    it('returns verification status', async () => {
      (KycVerificationRepository.findByUserId as any).mockResolvedValue(mockVerification);
      const result = await KycService.getVerificationStatus('user1');
      expect(result).toBeDefined();
    });
  });

  describe('listVerifications', () => {
    it('lists verifications', async () => {
      (KycVerificationRepository.listAll as any).mockResolvedValue([mockVerification]);
      const result = await KycService.listVerifications({});
      expect(result).toEqual([mockVerification]);
    });
  });

  describe('reviewVerification', () => {
    it('throws 404 when verification not found', async () => {
      (KycVerificationRepository.findById as any).mockResolvedValue(null);
      await expect(KycService.reviewVerification('kyc1', 'admin1', 'verified')).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('verifies a verification', async () => {
      (KycVerificationRepository.findById as any).mockResolvedValue(mockVerification);
      (KycVerificationRepository.updateById as any).mockResolvedValue({ ...mockVerification, status: 'verified' });
      (UserRepository.updateById as any).mockResolvedValue({});
      const result = await KycService.reviewVerification('kyc1', 'admin1', 'verified');
      expect(result).toBeDefined();
      expect(UserRepository.updateById).toHaveBeenCalledWith('user1', expect.objectContaining({ verified: true }));
    });

    it('rejects a verification', async () => {
      (KycVerificationRepository.findById as any).mockResolvedValue(mockVerification);
      (KycVerificationRepository.updateById as any).mockResolvedValue({ ...mockVerification, status: 'rejected' });
      (UserRepository.updateById as any).mockResolvedValue({});
      const result = await KycService.reviewVerification('kyc1', 'admin1', 'rejected', 'Docs unclear');
      expect(result).toBeDefined();
      expect(UserRepository.updateById).toHaveBeenCalledWith('user1', expect.objectContaining({ kycStatus: 'rejected' }));
    });
  });
});
