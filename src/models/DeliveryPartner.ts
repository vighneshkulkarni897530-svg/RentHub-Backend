import mongoose, { Schema, Document, Types } from 'mongoose';

export type PartnerStatus = 'active' | 'inactive' | 'busy';

export interface IDeliveryPartner extends Document {
  _id: Types.ObjectId;
  name: string;
  phone: string;
  email: string;
  vehicle: string;
  zones: string[];
  status: PartnerStatus;
  rating: number;
  totalDeliveries: number;
  isVerified: boolean;
  createdAt: Date;
}

const deliveryPartnerSchema = new Schema<IDeliveryPartner>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, default: '' },
    vehicle: { type: String, default: '' },
    zones: [{ type: String }],
    status: { type: String, enum: ['active', 'inactive', 'busy'], default: 'active' },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalDeliveries: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

deliveryPartnerSchema.index({ status: 1 });
deliveryPartnerSchema.index({ zones: 1 });

export const DeliveryPartner = mongoose.model<IDeliveryPartner>('DeliveryPartner', deliveryPartnerSchema);
export default DeliveryPartner;
