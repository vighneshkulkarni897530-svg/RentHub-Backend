import env from '../config/env';
import logger from '../config/logger';

// ============================================================
// RentHub - SMS / WhatsApp Notification Service
// ============================================================
// Supports Twilio or MSG91. When no provider keys are configured,
// logs a warning and returns (server still works without SMS).
// ============================================================

const isTwilioConfigured = Boolean(
  env.sms.provider === 'twilio' && env.sms.twilio.accountSid && env.sms.twilio.authToken && env.sms.twilio.from
);
const isMsg91Configured = Boolean(env.sms.provider === 'msg91' && env.sms.msg91.authKey);

let twilioClient: any = null;

if (isTwilioConfigured) {
  try {
    // Lazy require to avoid hard dependency when twilio not installed
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const twilio = require('twilio');
    twilioClient = twilio(env.sms.twilio.accountSid, env.sms.twilio.authToken);
    logger.info('Twilio configured for SMS.');
  } catch {
    twilioClient = null;
    logger.warn('Twilio package not available — SMS via Twilio disabled.');
  }
}

export interface SmsInput {
  to: string;
  message: string;
  templateId?: string;
}

/**
 * Send an SMS via the configured provider. Graceful no-op if not configured.
 */
export async function sendSms(input: SmsInput): Promise<void> {
  if (!input.to) {
    logger.warn('[sms] No recipient provided — skipping SMS.');
    return;
  }

  if (env.sms.provider === 'twilio' && isTwilioConfigured && twilioClient) {
    try {
      await twilioClient.messages.create({
        body: input.message,
        to: input.to,
        from: env.sms.twilio.from,
      });
      logger.info(`[sms] Sent via Twilio to ${input.to}`);
      return;
    } catch (error) {
      logger.error(`[sms] Twilio send failed: ${(error as Error).message}`);
      return;
    }
  }

  if (env.sms.provider === 'msg91' && isMsg91Configured) {
    try {
      const url = 'https://control.msg91.com/api/v5/flow/';
      const payload = {
        sender: env.sms.msg91.senderId,
        mobiles: input.to.replace('+', ''),
        message: input.message,
        template_id: input.templateId || env.sms.msg91.templateId,
      };
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          authkey: env.sms.msg91.authKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        logger.error(`[sms] MSG91 send failed with status ${res.status}`);
      } else {
        logger.info(`[sms] Sent via MSG91 to ${input.to}`);
      }
      return;
    } catch (error) {
      logger.error(`[sms] MSG91 send failed: ${(error as Error).message}`);
      return;
    }
  }

  logger.warn(`[sms] SMS not configured — skipping to ${input.to} with message "${input.message}"`);
}

export default {
  sendSms,
  isConfigured: isTwilioConfigured || isMsg91Configured,
};
