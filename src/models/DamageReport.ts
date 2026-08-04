import mongoose, { Schema, Document, Types } from 'mongoose';

export type DamageStage = 'pre_rental' | 'during_rental' | 'post_return';
export type DamageStatus = 'open' | 'under_review' | 'resolved' | 'closed';

export interface IDamageTimelineItem {
  status: DamageStatus;
  note: string;
  timestamp: Date;
}

export interface IDamageReport extends Document {
  _id: Types.ObjectId;
  booking: Types.ObjectId;
  product: Types.ObjectId;
  owner: Types.ObjectId;
  renter: Types.ObjectId;
  reporter: Types.ObjectId;
  stage: DamageStage;
  status: DamageStatus;
  photos: string[];
  videos: string[];
  comments: string;
  chargeEstimate: number;
  refundAmount: number;
  adminNote?: string;
  timeline: IDamageTimelineItem[];
  createdAt: Date;
  updatedAt: Date;
}

const damageTimelineSchema = new Schema<IDamageTimelineItem>(
  {
    status: { type: String, enum: ['open', 'under_review', 'resolved', 'closed'], required: true },
    note: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const damageReportSchema = new Schema<IDamageReport>(
  {
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    renter: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    stage: { type: String, enum: ['pre_rental', 'during_rental', 'post_return'], required: true },
    status: { type: String, enum: ['open', 'under_review', 'resolved', 'closed'], default: 'open' },
    photos: [{ type: String }],
    videos: [{ type: String }],
    comments: { type: String, default: '' },
    chargeEstimate: { type: Number, default: 0 },
    refundAmount: { type: Number, default: 0 },
    adminNote: { type: String, default: '' },
    timeline: { type: [damageTimelineSchema], default: [] },
  },
  { timestamps: true }
);

export const DamageReport = mongoose.model<IDamageReport>('DamageReport', damageReportSchema);
export default DamageReport;
