import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IConversation extends Document {
  _id: Types.ObjectId;
  participants: Types.ObjectId[];
  product?: Types.ObjectId;
  lastMessage?: Types.ObjectId;
  lastMessageAt?: Date;
  status: 'active' | 'completed' | 'pending';
}

const conversationSchema = new Schema<IConversation>(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    product: { type: Schema.Types.ObjectId, ref: 'Product' },
    lastMessage: { type: Schema.Types.ObjectId, ref: 'Message' },
    lastMessageAt: { type: Date },
    status: { type: String, enum: ['active', 'completed', 'pending'], default: 'active' },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1 });

export const Conversation = mongoose.model<IConversation>('Conversation', conversationSchema);
export default Conversation;

