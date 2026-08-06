import ApiError from '../utils/ApiError';
import env from '../config/env';
import InvoiceRepository from '../repositories/InvoiceRepository';
import PaymentRepository from '../repositories/PaymentRepository';
import emailService from './email.service';
import notificationService from './notification.service';

// ============================================================
// RentHub - Invoice Service (PDF invoices)
// ============================================================
// Generates invoice records with a printable HTML invoice and
// (when configured) a PDF URL. Preserves existing features.
// ============================================================

/**
 * Generate a unique sequential invoice number.
 */
function generateInvoiceNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `INV-${ts}-${rand}`;
}

export class InvoiceService {
/**
   * Create an invoice for a completed payment / booking.
   */
  async createInvoiceForPayment(paymentId: string) {
    const payment = await PaymentRepository.findById(paymentId, [
      { path: 'booking', select: '_id startDate endDate totalPrice status' },
      { path: 'user', select: 'name email avatar' },
      { path: 'owner', select: 'name email avatar' },
    ]);
    if (!payment) throw new ApiError(404, 'Payment not found');

    const booking = payment.booking as any;
    const user = payment.user as any;
    const owner = payment.owner as any;

    const invoiceNumber = generateInvoiceNumber();

    const invoice = await InvoiceRepository.create({
      invoiceNumber,
      booking: payment.booking as any,
      payment: payment._id as any,
      user: payment.user as any,
      owner: payment.owner as any,
      items: [
        {
          description: `Rental for booking #${(booking as any)._id}`,
          quantity: 1,
          unitPrice: payment.amount,
          amount: payment.amount,
        },
      ],
      subtotal: payment.amount,
      platformFee: payment.platformFee || 0,
      tax: 0,
      discount: 0,
      total: payment.amount,
      currency: payment.currency || 'INR',
      status: payment.status === 'completed' ? 'paid' : 'generated',
      pdfUrl: this.buildPdfUrl(invoiceNumber),
    });

    // Notify user + send invoice email
    void notificationService.createNotification({
      userId: payment.user.toString(),
      type: 'payment',
      title: 'Invoice generated',
      message: `Your invoice ${invoiceNumber} has been generated.`,
      link: `/customer/invoices/${invoice.id}`,
    });

    void emailService.sendInvoiceEmail(user.email, user.name, {
      invoiceNumber,
      link: `${env.clientUrl}/customer/invoices/${invoice.id}`,
    });

    return invoice;
  }

  /**
   * Render an HTML invoice (also used as basis for PDF).
   */
  renderHtml(invoice: any): string {
    const company = env.invoice;
    const items = (invoice.items || [])
      .map(
        (i: any) => `<tr>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${i.description}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center;">${i.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;">₹${i.unitPrice}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;">₹${i.amount}</td>
      </tr>`
      )
      .join('');

    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>Invoice ${invoice.invoiceNumber}</title></head>
<body style="font-family:Arial,sans-serif;margin:0;padding:32px;color:#111;">
  <div style="max-width:700px;margin:0 auto;">
    <table width="100%" style="border-bottom:2px solid #4f46e5;padding-bottom:16px;">
      <tr>
        <td><h1 style="margin:0;color:#4f46e5;">${company.companyName}</h1>
          <p style="margin:4px 0;color:#6b7280;font-size:13px;">${company.companyAddress}</p>
          <p style="margin:0;color:#6b7280;font-size:13px;">GST: ${company.companyGst}</p></td>
        <td align="right"><h2 style="margin:0;color:#6b7280;">INVOICE</h2>
          <p style="margin:4px 0;font-size:13px;">${invoice.invoiceNumber}</p>
          <p style="margin:0;font-size:13px;">${new Date(invoice.issuedAt || Date.now()).toLocaleDateString()}</p></td>
      </tr>
    </table>
    <table width="100%" style="margin:24px 0;">
      <tr>
        <td><h3 style="margin:0 0 8px;font-size:14px;color:#6b7280;">BILLED TO</h3>
          <p style="margin:0;">${invoice.user?.name || 'Customer'}</p>
          <p style="margin:0;color:#6b7280;font-size:13px;">${invoice.user?.email || ''}</p></td>
        <td align="right"><h3 style="margin:0 0 8px;font-size:14px;color:#6b7280;">OWNER</h3>
          <p style="margin:0;">${invoice.owner?.name || ''}</p></td>
      </tr>
    </table>
    <table width="100%" style="border-collapse:collapse;margin-top:16px;">
      <tr style="background:#f3f4f6;">
        <th style="padding:8px;text-align:left;">Description</th>
        <th style="padding:8px;">Qty</th>
        <th style="padding:8px;">Rate</th>
        <th style="padding:8px;">Amount</th>
      </tr>
      ${items}
    </table>
    <table width="100%" style="margin-top:24px;">
      <tr><td align="right" style="padding:4px;">Subtotal</td><td align="right" style="padding:4px;width:120px;">₹${invoice.subtotal || 0}</td></tr>
      <tr><td align="right" style="padding:4px;">Platform Fee</td><td align="right" style="padding:4px;">₹${invoice.platformFee || 0}</td></tr>
      <tr><td align="right" style="padding:4px;">Discount</td><td align="right" style="padding:4px;">-₹${invoice.discount || 0}</td></tr>
      <tr><td align="right" style="padding:4px;font-weight:700;font-size:16px;">Total</td><td align="right" style="padding:4px;font-weight:700;font-size:16px;">₹${invoice.total || 0}</td></tr>
    </table>
    <p style="margin-top:40px;color:#6b7280;font-size:12px;text-align:center;">Thank you for renting with ${company.companyName}!</p>
  </div>
</body></html>`;
  }

  private buildPdfUrl(invoiceNumber: string): string {
    // PDF generation endpoint will produce a real PDF when configured.
    // For now return a printable HTML route.
    return `${env.clientUrl}/customer/invoices/${invoiceNumber}/pdf`;
  }

  async getInvoice(id: string, userId: string, role: string) {
    const invoice = await InvoiceRepository.findByIdPopulated(id);
    if (!invoice) throw new ApiError(404, 'Invoice not found');

    const isOwner = invoice.owner._id.toString() === userId;
    const isUser = invoice.user._id.toString() === userId;
    if (!isOwner && !isUser && role !== 'admin') {
      throw new ApiError(403, 'You do not have access to this invoice');
    }
    return invoice;
  }

  async listInvoices(userId: string, role: string, options: any) {
    if (role === 'admin') return InvoiceRepository.listAll(options);
    if (role === 'owner') return InvoiceRepository.listForOwner(userId, options);
    return InvoiceRepository.listForUser(userId, options);
  }
}

export default new InvoiceService();
