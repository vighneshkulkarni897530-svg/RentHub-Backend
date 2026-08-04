import mongoose, { Schema, Document, Types } from 'mongoose';

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ITicketMessage {
  senderId: Types.ObjectId;
  senderName: string;
  content: string;
  isStaff: boolean;
  createdAt: Date;
}

export interface ISupportTicket extends Document {
  _id: Types.ObjectId;
  subject: string;
  message: string;
  user: Types.ObjectId;
  status: TicketStatus;
  priority: TicketPriority;
  category: string;
  assignedTo?: Types.ObjectId;
  messages: ITicketMessage[];
}

const ticketMessageSchema = new Schema(
  {
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderName: { type: String, required: true },
    content: { type: String, required: true, maxlength: 2000 },
    isStaff: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const supportTicketSchema = new Schema<ISupportTicket>(
  {
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, maxlength: 2000 },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    category: { type: String, default: 'general' },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    messages: { type: [ticketMessageSchema], default: [] },
  },
  { timestamps: true }
);

export const SupportTicket = mongoose.model<ISupportTicket>('SupportTicket', supportTicketSchema);
export default SupportTicket;

