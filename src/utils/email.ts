import nodemailer, { Transporter } from 'nodemailer';
import env from '../config/env';
import logger from '../config/logger';

let transporter: Transporter | null = null;

const isConfigured = Boolean(env.smtp.host && env.smtp.user && env.smtp.pass);

if (isConfigured) {
  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    auth: { user: env.smtp.user, pass: env.smtp.pass },
  });
}

/**
 * Send an email. If SMTP is not configured, logs a warning
 * and returns (server still works without email).
 */
export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!isConfigured || !transporter) {
    logger.warn(`[email] SMTP not configured — skipping email to ${to} with subject "${subject}"`);
    return;
  }
  try {
    await transporter.sendMail({ from: env.smtp.from, to, subject, html });
    logger.info(`[email] Sent "${subject}" to ${to}`);
  } catch (error) {
    logger.error(`[email] Failed to send to ${to}: ${(error as Error).message}`);
  }
}

export default sendEmail;

