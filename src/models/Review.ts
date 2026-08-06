import mongoose, { Schema, Document, Types } from 'mongoose';

export type ReviewModerationStatus = 'pending' | 'approved' | 'rejected' | 'flagged';

export interface IReview extends Document {
  _id: Types.ObjectId;
  product: Types.ObjectId;
  booking: Types.ObjectId;
  user: Types.ObjectId;
  rating: number;
  comment: string;
  images: string[];
  isVerified: boolean;
  moderationStatus: ReviewModerationStatus;
  moderatedBy?: Types.ObjectId;
  moderatedAt?: Date;
  response?: string;
  respondedBy?: Types.ObjectId;
  respondedAt?: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    booking: { type: Schema.Types.ObjectId, ref: 'Booking' },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, maxlength: 1000 },
    images: [{ type: String }],
    isVerified: { type: Boolean, default: false },
    moderationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'flagged'],
      default: 'approved',
    },
    moderatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    moderatedAt: { type: Date },
    response: { type: String, maxlength: 1000 },
    respondedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    respondedAt: { type: Date },
  },
  { timestamps: true }
);

// One review per user per product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });
reviewSchema.index({ product: 1, rating: 1 });

export const Review = mongoose.model<IReview>('Review', reviewSchema);
export default Review;

