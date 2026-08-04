import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISearchAnalytics extends Document {
  _id: Types.ObjectId;
  query: string;
  normalizedQuery: string;
  user?: Types.ObjectId;
  sessionId?: string;
  resultCount: number;
  clickedProductId?: Types.ObjectId;
  isClick: boolean;
  category?: string;
  location?: string;
  source: 'navbar' | 'search' | 'autocomplete' | 'suggestion' | 'recommendation';
  createdAt: Date;
}

const searchAnalyticsSchema = new Schema<ISearchAnalytics>(
  {
    query: { type: String, required: true, trim: true, maxlength: 200 },
    normalizedQuery: { type: String, required: true, lowercase: true, trim: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', index: true, default: null },
    sessionId: { type: String, default: '' },
    resultCount: { type: Number, default: 0 },
    clickedProductId: { type: Schema.Types.ObjectId, ref: 'Product', default: null },
    isClick: { type: Boolean, default: false },
    category: { type: String, default: '' },
    location: { type: String, default: '' },
    source: {
      type: String,
      enum: ['navbar', 'search', 'autocomplete', 'suggestion', 'recommendation'],
      default: 'search',
    },
  },
  { timestamps: true }
);

searchAnalyticsSchema.index({ normalizedQuery: 1, createdAt: -1 });
searchAnalyticsSchema.index({ user: 1, createdAt: -1 });

export const SearchAnalytics = mongoose.model<ISearchAnalytics>('SearchAnalytics', searchAnalyticsSchema);
export default SearchAnalytics;
