import mongoose, { Schema, Document, Types } from 'mongoose';

export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export interface IOwnerVerification extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  storeName: string;
  storeDescription: string;
  documentType: 'government_id' | 'business_license' | 'address_proof';
  documentUrls: string[];
  status: VerificationStatus;
  adminNote: string;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
}

const ownerVerificationSchema = new Schema<IOwnerVerification>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    storeName: { type: String, required: true, trim: true },
    storeDescription: { type: String, default: '' },
    documentType: {
      type: String,
      enum: ['government_id', 'business_license', 'address_proof'],
      required: true,
    },
    documentUrls: [{ type: String }],
    status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
    adminNote: { type: String, default: '' },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

export const OwnerVerification = mongoose.model<IOwnerVerification>(
  'OwnerVerification',
  ownerVerificationSchema
);
export default OwnerVerification;

