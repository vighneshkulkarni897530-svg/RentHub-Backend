import ApiError from '../utils/ApiError';
import SupportTicketRepository from '../repositories/SupportTicketRepository';
import UserRepository from '../repositories/UserRepository';
import { CreateSupportTicketInput } from '../validators/supportTicket';

export class SupportTicketService {
  async createTicket(userId: string, input: CreateSupportTicketInput) {
    const user = await UserRepository.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');

    const ticket = await SupportTicketRepository.create({
      subject: input.subject,
      message: input.message,
      user: userId as any,
      category: input.category || 'general',
      priority: (input.priority || 'medium') as any,
      messages: [
        {
          senderId: userId as any,
          senderName: user.name,
          content: input.message,
          isStaff: false,
          createdAt: new Date(),
        },
      ],
    });
    return SupportTicketRepository.findByIdPopulated(ticket.id);
  }

  async listTickets(options: any) {
    return SupportTicketRepository.listAll(options);
  }

  async getMyTickets(userId: string) {
    return SupportTicketRepository.findByUser(userId);
  }

  async getTicketById(id: string, userId?: string) {
    const ticket = await SupportTicketRepository.findByIdPopulated(id);
    if (!ticket) throw new ApiError(404, 'Ticket not found');
    if (userId && ticket.user.toString() !== userId) {
      // Only allow the ticket owner or admins (admins bypass via controller role check)
      throw new ApiError(403, 'You do not have access to this ticket');
    }
    return ticket;
  }

  async updateStatus(id: string, input: { status?: string; priority?: string; assignedTo?: string }, adminId: string) {
    const ticket = await SupportTicketRepository.findById(id);
    if (!ticket) throw new ApiError(404, 'Ticket not found');
    const updateData: Record<string, unknown> = {};
    if (input.status) updateData.status = input.status;
    if (input.priority) updateData.priority = input.priority;
    if (input.assignedTo) updateData.assignedTo = input.assignedTo;
    return SupportTicketRepository.updateById(id, updateData);
  }

  async addMessage(id: string, userId: string, content: string, isStaff = false) {
    const ticket = await SupportTicketRepository.findById(id);
    if (!ticket) throw new ApiError(404, 'Ticket not found');

    const user = await UserRepository.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');

    const messages = [...ticket.messages, {
      senderId: userId as any,
      senderName: user.name,
      content,
      isStaff,
      createdAt: new Date(),
    }];

    return SupportTicketRepository.updateById(id, {
      messages,
      status: ticket.status === 'closed' ? 'in_progress' : ticket.status,
    });
  }
}

export default new SupportTicketService();

