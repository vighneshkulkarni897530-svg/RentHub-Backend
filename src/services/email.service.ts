import sendEmail from '../utils/email';
import { renderEmail, EmailContext } from './emailTemplates';

const FRONTEND_URL = process.env.CLIENT_URL || 'http://localhost:3000';

/**
 * Send a templated email. Preserves existing function signatures
 * (no breaking API changes) while upgrading to responsive templates.
 */

async function sendTemplate(
  to: string,
  template: string,
  ctx: EmailContext
): Promise<void> {
  const { subject, html } = renderEmail(template, ctx);
  await sendEmail(to, subject, html);
}

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  await sendTemplate(to, 'welcome', {
    name,
    link: `${FRONTEND_URL}/public/search`,
  });
}

export async function sendVerificationEmail(to: string, name: string, token: string): Promise<void> {
  const link = `${FRONTEND_URL}/auth/verify-email?token=${token}`;
  await sendTemplate(to, 'verifyEmail', { name, link });
}

export async function sendPasswordResetEmail(to: string, name: string, token: string): Promise<void> {
  const link = `${FRONTEND_URL}/auth/reset-password?token=${token}`;
  await sendTemplate(to, 'passwordReset', { name, link });
}

export async function sendBookingConfirmationEmail(to: string, name: string, bookingDetails: Record<string, unknown>): Promise<void> {
  await sendTemplate(to, 'bookingConfirmation', {
    name,
    product: bookingDetails.product,
    startDate: bookingDetails.startDate,
    endDate: bookingDetails.endDate,
    total: bookingDetails.grandTotal ?? bookingDetails.totalPrice,
    link: `${FRONTEND_URL}/dashboard/my-rentals`,
  });
}

export async function sendBookingApprovedEmail(
  to: string,
  name: string,
  data: { product?: string; startDate?: string; endDate?: string; link?: string }
): Promise<void> {
  await sendTemplate(to, 'bookingApproved', {
    name,
    product: data.product,
    startDate: data.startDate,
    endDate: data.endDate,
    link: data.link || `${FRONTEND_URL}/booking/checkout`,
  });
}

export async function sendBookingCancelledEmail(
  to: string,
  name: string,
  data: { product?: string; reason?: string }
): Promise<void> {
  await sendTemplate(to, 'bookingCancelled', {
    name,
    product: data.product,
    reason: data.reason,
  });
}

export async function sendPaymentSuccessEmail(
  to: string,
  name: string,
  data: { amount?: number; transactionId?: string; link?: string }
): Promise<void> {
  await sendTemplate(to, 'paymentSuccess', {
    name,
    amount: data.amount,
    transactionId: data.transactionId,
    link: data.link || `${FRONTEND_URL}/customer/invoices`,
  });
}

export async function sendRefundEmail(
  to: string,
  name: string,
  data: { amount?: number; refundId?: string; status?: string }
): Promise<void> {
  await sendTemplate(to, 'refund', {
    name,
    amount: data.amount,
    refundId: data.refundId,
    status: data.status,
  });
}

export async function sendDeliveryUpdateEmail(
  to: string,
  name: string,
  data: { status?: string; note?: string; partner?: string; estimatedArrival?: string; link?: string }
): Promise<void> {
  await sendTemplate(to, 'deliveryUpdate', {
    name,
    status: data.status,
    note: data.note,
    partner: data.partner,
    estimatedArrival: data.estimatedArrival,
    link: data.link || `${FRONTEND_URL}/dashboard/my-rentals`,
  });
}

export async function sendOtpEmail(to: string, name: string, otp: string): Promise<void> {
  await sendTemplate(to, 'otp', { name, otp });
}

export async function sendInvoiceEmail(
  to: string,
  name: string,
  data: { invoiceNumber?: string; link?: string }
): Promise<void> {
  await sendTemplate(to, 'invoice', {
    name,
    invoiceNumber: data.invoiceNumber,
    link: data.link,
  });
}

export async function sendGenericEmail(
  to: string,
  title: string,
  message: string,
  link?: string
): Promise<void> {
  await sendTemplate(to, 'deliveryUpdate', {
    name: '',
    status: title,
    note: message,
    link,
  });
}

export default {
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendBookingConfirmationEmail,
  sendBookingApprovedEmail,
  sendBookingCancelledEmail,
  sendPaymentSuccessEmail,
  sendRefundEmail,
  sendDeliveryUpdateEmail,
  sendOtpEmail,
  sendInvoiceEmail,
  sendGenericEmail,
};
