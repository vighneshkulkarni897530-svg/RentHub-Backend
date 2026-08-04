import { Response } from 'express';
import SupportTicketService from '../services/supportTicket.service';
import ApiResponse from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middleware/auth';

export class SupportTicketController {
  createTicket = asyncHandler(async (req: AuthRequest, res: Response) => {
    const ticket = await SupportTicketService.createTicket(req.user!.id, req.body);
    res.status(201).json(ApiResponse.ok(ticket, 'Support ticket created'));
  });

  getMyTickets = asyncHandler(async (req: AuthRequest, res: Response) => {
    const tickets = await SupportTicketService.getMyTickets(req.user!.id);
    res.status(200).json(ApiResponse.ok(tickets));
  });

  getTicketById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const ticket = await SupportTicketService.getTicketById(req.params.id, req.user!.id);
    res.status(200).json(ApiResponse.ok(ticket));
  });

  updateStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const ticket = await SupportTicketService.updateStatus(
      req.params.id,
      { status: req.body.status, priority: req.body.priority, assignedTo: req.body.assignedTo },
      req.user!.id
    );
    res.status(200).json(ApiResponse.ok(ticket, 'Ticket updated'));
  });

  addMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
    const isStaff = req.user!.role === 'admin' || req.user!.role === 'owner';
    const ticket = await SupportTicketService.addMessage(req.params.id, req.user!.id, req.body.content, isStaff);
    res.status(200).json(ApiResponse.ok(ticket, 'Message added'));
  });
}

export default new SupportTicketController();

