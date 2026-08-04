import mongoose, { Schema, Document, Types } from 'mongoose';

export type ReportType = 'product' | 'user' | 'booking' | 'review';
export type ReportStatus = 'open' | 'investigating' | 'resolved' | 'dismissed';
export type ReportPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface IReportTimelineItem {
  status: ReportStatus;
  note: string;
  timestamp: Date;
}

export interface IReport extends Document {
  _id: Types.ObjectId;
  type: ReportType;
  reportedItemId: Types.ObjectId;
  reporter: Types.ObjectId;
  reason: string;
  description: string;
  evidenceUrls: string[];
  status: ReportStatus;
  priority: ReportPriority;
  resolvedBy?: Types.ObjectId;
  resolvedAt?: Date;
  adminResolution?: string;
  timeline: IReportTimelineItem[];
}

const reportSchema = new Schema<IReport>(
  {
    type: { type: String, enum: ['product', 'user', 'booking', 'review'], required: true },
    reportedItemId: { type: Schema.Types.ObjectId, required: true, index: true },
    reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reason: { type: String, required: true, trim: true },
    description: { type: String, default: '', maxlength: 2000 },
    evidenceUrls: { type: [String], default: [] },
    status: {
      type: String,
      enum: ['open', 'investigating', 'resolved', 'dismissed'],
      default: 'open',
    },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    timeline: {
      type: [
        {
          status: { type: String, enum: ['open', 'investigating', 'resolved', 'dismissed'], required: true },
          note: { type: String, default: '' },
          timestamp: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: { type: Date },
    adminResolution: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Report = mongoose.model<IReport>('Report', reportSchema);
export default Report;

