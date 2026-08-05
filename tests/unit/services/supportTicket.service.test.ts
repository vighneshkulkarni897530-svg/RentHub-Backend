// SupportTicketService unit tests — repositories mocked via vi.mock

vi.mock('../../../src/repositories/SupportTicketRepository', () => ({
  default: {
    create: vi.fn(),
    findByIdPopulated: vi.fn(),
    listAll: vi.fn(),
    findByUser: vi.fn(),
    findById: vi.fn(),
    updateById: vi.fn(),
  },
}));

vi.mock('../../../src/repositories/UserRepository', () => ({
  default: {
    findById: vi.fn(),
  },
}));

import SupportTicketService from '../../../src/services/supportTicket.service';
import SupportTicketRepository from '../../../src/repositories/SupportTicketRepository';
import UserRepository from '../../../src/repositories/UserRepository';

const mockUser = { _id: 'user1', name: 'Test User' };
const mockTicket = {
  id: 't1',
  user: { toString: () => 'user1' },
  subject: 'Help',
  messages: [],
  status: 'open',
  priority: 'medium',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('SupportTicketService', () => {
  describe('createTicket', () => {
    it('creates a ticket', async () => {
      (UserRepository.findById as any).mockResolvedValue(mockUser);
      (SupportTicketRepository.create as any).mockResolvedValue(mockTicket);
      (SupportTicketRepository.findByIdPopulated as any).mockResolvedValue(mockTicket);
      const result = await SupportTicketService.createTicket('user1', {
        subject: 'Help',
        message: 'I need help',
      } as any);
      expect(result).toBeDefined();
      expect(SupportTicketRepository.create).toHaveBeenCalled();
    });

    it('throws 404 when user not found', async () => {
      (UserRepository.findById as any).mockResolvedValue(null);
      await expect(
        SupportTicketService.createTicket('user1', { subject: 'Help', message: 'x' } as any)
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('listTickets', () => {
    it('lists tickets', async () => {
      (SupportTicketRepository.listAll as any).mockResolvedValue([mockTicket]);
      const result = await SupportTicketService.listTickets({});
      expect(result).toEqual([mockTicket]);
    });
  });

  describe('getMyTickets', () => {
    it('returns user tickets', async () => {
      (SupportTicketRepository.findByUser as any).mockResolvedValue([mockTicket]);
      const result = await SupportTicketService.getMyTickets('user1');
      expect(result).toEqual([mockTicket]);
    });
  });

  describe('getTicketById', () => {
    it('returns ticket for owner', async () => {
      (SupportTicketRepository.findByIdPopulated as any).mockResolvedValue(mockTicket);
      const result = await SupportTicketService.getTicketById('t1', 'user1');
      expect(result).toEqual(mockTicket);
    });

    it('throws 404 when not found', async () => {
      (SupportTicketRepository.findByIdPopulated as any).mockResolvedValue(null);
      await expect(SupportTicketService.getTicketById('t1')).rejects.toMatchObject({ statusCode: 404 });
    });

    it('throws 403 when not owner', async () => {
      (SupportTicketRepository.findByIdPopulated as any).mockResolvedValue(mockTicket);
      await expect(SupportTicketService.getTicketById('t1', 'stranger')).rejects.toMatchObject({ statusCode: 403 });
    });
  });

  describe('updateStatus', () => {
    it('updates ticket status', async () => {
      (SupportTicketRepository.findById as any).mockResolvedValue(mockTicket);
      (SupportTicketRepository.updateById as any).mockResolvedValue(mockTicket);
      const result = await SupportTicketService.updateStatus('t1', { status: 'resolved' }, 'admin1');
      expect(result).toBeDefined();
    });

    it('throws 404 when not found', async () => {
      (SupportTicketRepository.findById as any).mockResolvedValue(null);
      await expect(SupportTicketService.updateStatus('t1', { status: 'resolved' }, 'admin1')).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe('addMessage', () => {
    it('adds message to ticket', async () => {
      (SupportTicketRepository.findById as any).mockResolvedValue({ ...mockTicket, status: 'open' });
      (UserRepository.findById as any).mockResolvedValue(mockUser);
      (SupportTicketRepository.updateById as any).mockResolvedValue(mockTicket);
      const result = await SupportTicketService.addMessage('t1', 'user1', 'More info');
      expect(result).toBeDefined();
    });

    it('throws 404 when ticket not found', async () => {
      (SupportTicketRepository.findById as any).mockResolvedValue(null);
      await expect(SupportTicketService.addMessage('t1', 'user1', 'Hi')).rejects.toMatchObject({ statusCode: 404 });
    });
  });
});
