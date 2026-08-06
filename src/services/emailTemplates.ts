// ============================================================
// RentHub - Responsive Email Templates
// ============================================================
// Professional HTML templates for all transactional emails.
// Responsive, inline-styled, works across email clients.
// ============================================================

export interface EmailContext {
  name?: string;
  link?: string;
  [key: string]: unknown;
}

const BRAND_COLOR = '#4f46e5';
const MUTED = '#6b7280';

function wrap(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td style="background-color:${BRAND_COLOR};padding:24px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">RentHub</h1>
              <p style="margin:4px 0 0;color:#c7d2fe;font-size:13px;">Rent anything, anywhere</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;color:#1f2937;font-size:15px;line-height:1.6;">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;background-color:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;color:${MUTED};font-size:12px;">
              <p style="margin:0 0 8px;">You received this email because you're a member of RentHub.</p>
              <p style="margin:0;">© ${new Date().getFullYear()} RentHub. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function button(link: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr>
    <td align="center" style="background-color:${BRAND_COLOR};border-radius:8px;padding:12px 28px;">
      <a href="${link}" style="color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;display:inline-block;">${label}</a>
    </td>
  </tr>
</table>`;
}

function greeting(name?: string): string {
  return `<p style="margin:0 0 16px;">Hi ${name || 'there'},</p>`;
}

export function welcomeTemplate(ctx: EmailContext): string {
  return wrap(
    'Welcome to RentHub',
    `${greeting(ctx.name)}
     <p style="margin:0 0 16px;">Welcome aboard! Your account has been created successfully. You can now rent and list items across categories.</p>
     ${button(ctx.link || 'http://localhost:3000', 'Explore RentHub')}
     <p style="margin:0;color:${MUTED};font-size:13px;">Tip: Complete your profile to get personalized recommendations.</p>`
  );
}

export function verifyEmailTemplate(ctx: EmailContext): string {
  return wrap(
    'Verify your RentHub email',
    `${greeting(ctx.name)}
     <p style="margin:0 0 16px;">Please verify your email address to activate your account. This link expires in 24 hours.</p>
     ${button(ctx.link || '#', 'Verify Email')}
     <p style="margin:0;color:${MUTED};font-size:13px;">If the button doesn't work, copy this link: ${ctx.link || ''}</p>`
  );
}

export function bookingConfirmationTemplate(ctx: EmailContext): string {
  return wrap(
    'Booking Confirmed - RentHub',
    `${greeting(ctx.name)}
     <p style="margin:0 0 16px;">Your booking request has been received. Here are the details:</p>
     <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;padding:16px;margin:0 0 16px;">
       <tr><td style="padding:4px 0;color:${MUTED};">Product</td><td style="padding:4px 0;font-weight:600;text-align:right;">${ctx.product || '—'}</td></tr>
       <tr><td style="padding:4px 0;color:${MUTED};">Start</td><td style="padding:4px 0;font-weight:600;text-align:right;">${ctx.startDate || '—'}</td></tr>
       <tr><td style="padding:4px 0;color:${MUTED};">End</td><td style="padding:4px 0;font-weight:600;text-align:right;">${ctx.endDate || '—'}</td></tr>
       <tr><td style="padding:4px 0;color:${MUTED};">Total</td><td style="padding:4px 0;font-weight:600;text-align:right;">₹${ctx.total || '0'}</td></tr>
     </table>
     <p style="margin:0 0 16px;">The owner will review your request shortly.</p>
     ${button(ctx.link || 'http://localhost:3000/dashboard/my-rentals', 'View Booking')}`
  );
}

export function bookingApprovedTemplate(ctx: EmailContext): string {
  return wrap(
    'Booking Approved - RentHub',
    `${greeting(ctx.name)}
     <p style="margin:0 0 16px;">Great news! Your booking for <strong>${ctx.product || 'your item'}</strong> has been approved.</p>
     <p style="margin:0 0 16px;">Start date: ${ctx.startDate || '—'}<br/>End date: ${ctx.endDate || '—'}</p>
     <p style="margin:0 0 16px;">You can proceed to payment to confirm your booking.</p>
     ${button(ctx.link || 'http://localhost:3000/booking/checkout', 'Proceed to Payment')}`
  );
}

export function bookingCancelledTemplate(ctx: EmailContext): string {
  return wrap(
    'Booking Cancelled - RentHub',
    `${greeting(ctx.name)}
     <p style="margin:0 0 16px;">Your booking for <strong>${ctx.product || 'your item'}</strong> has been cancelled.</p>
     <p style="margin:0 0 16px;">Reason: ${ctx.reason || 'Not specified'}</p>
     <p style="margin:0;color:${MUTED};font-size:13px;">If you paid for this booking, a refund will be processed to your original payment method or wallet.</p>`
  );
}

export function paymentSuccessTemplate(ctx: EmailContext): string {
  return wrap(
    'Payment Successful - RentHub',
    `${greeting(ctx.name)}
     <p style="margin:0 0 16px;">Your payment of <strong>₹${ctx.amount || '0'}</strong> was successful.</p>
     <p style="margin:0 0 16px;">Transaction ID: ${ctx.transactionId || '—'}</p>
     ${button(ctx.link || 'http://localhost:3000/customer/invoices', 'View Invoice')}`
  );
}

export function refundTemplate(ctx: EmailContext): string {
  return wrap(
    'Refund Processed - RentHub',
    `${greeting(ctx.name)}
     <p style="margin:0 0 16px;">A refund of <strong>₹${ctx.amount || '0'}</strong> has been initiated for your booking.</p>
     <p style="margin:0 0 16px;">Refund ID: ${ctx.refundId || '—'}<br/>Status: ${ctx.status || 'Processing'}</p>
     <p style="margin:0;color:${MUTED};font-size:13px;">Refunds typically take 3-7 business days depending on your bank.</p>`
  );
}

export function passwordResetTemplate(ctx: EmailContext): string {
  return wrap(
    'Reset your RentHub password',
    `${greeting(ctx.name)}
     <p style="margin:0 0 16px;">We received a request to reset your password. Click below to create a new one. This link expires in 1 hour.</p>
     ${button(ctx.link || '#', 'Reset Password')}
     <p style="margin:0;color:${MUTED};font-size:13px;">If you didn't request this, you can safely ignore this email.</p>`
  );
}

export function deliveryUpdateTemplate(ctx: EmailContext): string {
  return wrap(
    'Delivery Update - RentHub',
    `${greeting(ctx.name)}
     <p style="margin:0 0 16px;">Your delivery status has been updated to <strong>${ctx.status || '—'}</strong>.</p>
     <p style="margin:0 0 16px;">${ctx.note || 'Your item is on the move!'}</p>
     <p style="margin:0 0 16px;">Partner: ${ctx.partner || '—'}<br/>Estimated arrival: ${ctx.estimatedArrival || '—'}</p>
     ${button(ctx.link || 'http://localhost:3000/dashboard/my-rentals', 'Track Delivery')}`
  );
}

export function otpTemplate(ctx: EmailContext): string {
  return wrap(
    'Your OTP - RentHub',
    `${greeting(ctx.name)}
     <p style="margin:0 0 16px;">Your one-time password is:</p>
     <p style="margin:0 0 16px;font-size:28px;font-weight:700;letter-spacing:4px;color:${BRAND_COLOR};">${ctx.otp || '—'}</p>
     <p style="margin:0;color:${MUTED};font-size:13px;">This OTP is valid for 10 minutes. Never share it with anyone.</p>`
  );
}

export function invoiceTemplate(ctx: EmailContext): string {
  return wrap(
    `Invoice ${ctx.invoiceNumber || ''} - RentHub`,
    `${greeting(ctx.name)}
     <p style="margin:0 0 16px;">Your invoice <strong>${ctx.invoiceNumber || ''}</strong> is ready. View it below.</p>
     ${button(ctx.link || '#', 'View Invoice')}`
  );
}

const templates: Record<string, (ctx: EmailContext) => string> = {
  welcome: welcomeTemplate,
  verifyEmail: verifyEmailTemplate,
  bookingConfirmation: bookingConfirmationTemplate,
  bookingApproved: bookingApprovedTemplate,
  bookingCancelled: bookingCancelledTemplate,
  paymentSuccess: paymentSuccessTemplate,
  refund: refundTemplate,
  passwordReset: passwordResetTemplate,
  deliveryUpdate: deliveryUpdateTemplate,
  otp: otpTemplate,
  invoice: invoiceTemplate,
};

export function renderEmail(template: string, ctx: EmailContext): { subject: string; html: string } {
  const renderer = templates[template] || welcomeTemplate;
  const html = renderer(ctx);
  const subjectMap: Record<string, string> = {
    welcome: 'Welcome to RentHub',
    verifyEmail: 'Verify your RentHub email',
    bookingConfirmation: 'Booking Confirmed - RentHub',
    bookingApproved: 'Booking Approved - RentHub',
    bookingCancelled: 'Booking Cancelled - RentHub',
    paymentSuccess: 'Payment Successful - RentHub',
    refund: 'Refund Processed - RentHub',
    passwordReset: 'Reset your RentHub password',
    deliveryUpdate: 'Delivery Update - RentHub',
    otp: 'Your OTP - RentHub',
    invoice: `Invoice ${ctx.invoiceNumber || ''} - RentHub`,
  };
  return { subject: subjectMap[template] || 'RentHub', html };
}

export default {
  welcomeTemplate,
  verifyEmailTemplate,
  bookingConfirmationTemplate,
  bookingApprovedTemplate,
  bookingCancelledTemplate,
  paymentSuccessTemplate,
  refundTemplate,
  passwordResetTemplate,
  deliveryUpdateTemplate,
  otpTemplate,
  invoiceTemplate,
  renderEmail,
};
