import mongoose, { Schema, Document, Types } from 'mongoose';

export type KycStatus = 'pending' | 'verified' | 'rejected';
export type KycDocumentType = 'aadhaar' | 'pan' | 'passport' | 'driving_license';
export type UserRole = 'customer' | 'owner' | 'admin';

export interface IKycVerification extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  role: UserRole;
  documentType: KycDocumentType;
  documentUrls: string[];
  status: KycStatus;
  expiryDate?: Date;
  rejectionReason?: string;
  adminNote?: string;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  ocrData?: Record<string, unknown>;
  verifiedBadge: boolean;
}

const kycVerificationSchema = new Schema<IKycVerification>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    role: { type: String, enum: ['customer', 'owner', 'admin'], required: true },
    documentType: {
      type: String,
      enum: ['aadhaar', 'pan', 'passport', 'driving_license'],
      required: true,
    },
    documentUrls: [{ type: String, required: true }],
    status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
    expiryDate: { type: Date },
    rejectionReason: { type: String, default: '' },
    adminNote: { type: String, default: '' },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    ocrData: { type: Schema.Types.Mixed, default: {} },
    verifiedBadge: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const KycVerification = mongoose.model<IKycVerification>('KycVerification', kycVerificationSchema);
export default KycVerification;
