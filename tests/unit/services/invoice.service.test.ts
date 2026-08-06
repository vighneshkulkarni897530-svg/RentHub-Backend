// InvoiceService unit tests — repositories mocked via vi.mock

vi.mock('../../../src/repositories/InvoiceRepository', () => ({
  default: {
    create: vi.fn(),
    findByIdPopulated: vi.fn(),
    listAll: vi.fn(),
    listForOwner: vi.fn(),
    listForUser: vi.fn(),
  },
}));

vi.mock('../../../src/repositories/PaymentRepository', () => ({
  default: {
    findById: vi.fn(),
  },
}));

vi.mock('../../../src/services/notification.service', () => ({
  default: {
    createNotification: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../../src/services/email.service', () => ({
  default: {
    sendInvoiceEmail: vi.fn().mockResolvedValue(undefined),
  },
}));

import InvoiceService from '../../../src/services/invoice.service';
import InvoiceRepository from '../../../src/repositories/InvoiceRepository';
import PaymentRepository from '../../../src/repositories/PaymentRepository';

const mockPayment = {
  _id: 'pay1',
  booking: { _id: 'book1', startDate: new Date(), endDate: new Date(), totalPrice: 1000, status: 'completed' },
  user: { _id: 'renter1', name: 'Renter', email: 'renter@r.com' },
  owner: { _id: 'owner1', name: 'Owner', email: 'owner@r.com' },
  amount: 1000,
  platformFee: 100,
  status: 'completed',
  currency: 'INR',
};

const mockInvoice = {
  _id: 'inv1',
  id: 'inv1',
  invoiceNumber: 'INV-1',
  booking: 'book1',
  payment: 'pay1',
  user: 'renter1',
  owner: 'owner1',
  items: [],
  subtotal: 1000,
  platformFee: 100,
  total: 1000,
  status: 'paid',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('InvoiceService', () => {
  describe('createInvoiceForPayment', () => {
    it('creates an invoice for a payment', async () => {
      (PaymentRepository.findById as any).mockResolvedValue(mockPayment);
      (InvoiceRepository.create as any).mockResolvedValue(mockInvoice);
      const result = await InvoiceService.createInvoiceForPayment('pay1');
      expect(result).toEqual(mockInvoice);
      expect(InvoiceRepository.create).toHaveBeenCalled();
    });

    it('throws 404 when payment not found', async () => {
      (PaymentRepository.findById as any).mockResolvedValue(null);
      await expect(InvoiceService.createInvoiceForPayment('pay1')).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('renderHtml', () => {
    it('renders an HTML invoice', () => {
      const html = InvoiceService.renderHtml(mockInvoice);
      expect(html).toContain('INVOICE');
      expect(html).toContain('INV-1');
    });
  });

  describe('getInvoice', () => {
    it('throws 404 when invoice not found', async () => {
      (InvoiceRepository.findByIdPopulated as any).mockResolvedValue(null);
      await expect(InvoiceService.getInvoice('inv1', 'renter1', 'customer')).rejects.toMatchObject({ statusCode: 404 });
    });

    it('returns invoice for the user', async () => {
      (InvoiceRepository.findByIdPopulated as any).mockResolvedValue({
        ...mockInvoice,
        user: { _id: 'renter1' },
        owner: { _id: 'owner1' },
      });
      const result = await InvoiceService.getInvoice('inv1', 'renter1', 'customer');
      expect(result).toBeDefined();
    });
  });

  describe('listInvoices', () => {
    it('admin lists all', async () => {
      (InvoiceRepository.listAll as any).mockResolvedValue([mockInvoice]);
      const result = await InvoiceService.listInvoices('admin1', 'admin', {});
      expect(result).toEqual([mockInvoice]);
    });

    it('owner lists their invoices', async () => {
      (InvoiceRepository.listForOwner as any).mockResolvedValue([mockInvoice]);
      const result = await InvoiceService.listInvoices('owner1', 'owner', {});
      expect(result).toEqual([mockInvoice]);
    });

    it('customer lists their invoices', async () => {
      (InvoiceRepository.listForUser as any).mockResolvedValue([mockInvoice]);
      const result = await InvoiceService.listInvoices('renter1', 'customer', {});
      expect(result).toEqual([mockInvoice]);
    });
  });
});
