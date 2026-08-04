import ApiError from '../utils/ApiError';
import KycVerificationRepository from '../repositories/KycVerificationRepository';
import UserRepository from '../repositories/UserRepository';
import notificationService from './notification.service';
import { IKycVerification, KycStatus, KycDocumentType } from '../models/KycVerification';

export interface SubmitKycInput {
  documentType: KycDocumentType;
  documentUrls: string[];
  expiryDate?: Date;
  ocrData?: Record<string, unknown>;
}

export class KycService {
  async submitVerification(userId: string, role: string, input: SubmitKycInput) {
    if (!input.documentUrls || input.documentUrls.length === 0) {
      throw new ApiError(400, 'At least one document image is required');
    }

    const existing = await KycVerificationRepository.findByUserId(userId);
    if (existing && existing.status === 'pending') {
      throw new ApiError(409, 'Verification already pending');
    }

    const data: Partial<IKycVerification> = {
      user: userId as any,
      role: role as any,
      documentType: input.documentType,
      documentUrls: input.documentUrls,
      expiryDate: input.expiryDate,
      ocrData: input.ocrData || {},
      status: 'pending',
      verifiedBadge: false,
    };

    let verification: IKycVerification;
    if (existing) {
      verification = await KycVerificationRepository.updateById(existing.id, data as any) as IKycVerification;
    } else {
      verification = await KycVerificationRepository.create(data as any);
    }

    await UserRepository.updateById(userId, { kycStatus: 'pending', documents: input.documentUrls });

    return KycVerificationRepository.findByUserId(userId);
  }

  async getVerificationStatus(userId: string) {
    return KycVerificationRepository.findByUserId(userId);
  }

  async listVerifications(options: { status?: string; role?: string } = {}) {
    return KycVerificationRepository.listAll(options);
  }

  async reviewVerification(verificationId: string, adminId: string, status: KycStatus, note?: string) {
    const verification = await KycVerificationRepository.findById(verificationId);
    if (!verification) throw new ApiError(404, 'Verification not found');

    const updated = await KycVerificationRepository.updateById(verificationId, {
      status,
      adminNote: note || '',
      reviewedBy: adminId as any,
      reviewedAt: new Date(),
      verifiedBadge: status === 'verified',
      rejectionReason: status === 'rejected' ? note || 'Verification rejected' : undefined,
    });

    if (status === 'verified') {
      await UserRepository.updateById(verification.user.toString(), {
        verified: true,
        kycStatus: 'verified',
        documents: verification.documentUrls,
      });
      void notificationService.createNotification({
        userId: verification.user.toString(),
        type: 'system',
        title: 'KYC Verified',
        message: 'Your identity verification has been approved.',
        link: '/dashboard/profile',
      });
    } else {
      await UserRepository.updateById(verification.user.toString(), {
        kycStatus: 'rejected',
      });
      void notificationService.createNotification({
        userId: verification.user.toString(),
        type: 'system',
        title: 'KYC Rejected',
        message: note || 'Your identity verification was rejected. Please update and resubmit your documents.',
        link: '/dashboard/profile',
      });
    }

    return updated;
  }
}

export default new KycService();
