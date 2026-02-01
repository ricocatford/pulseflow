import { Result, ok } from "@/lib/errors";
import { EMAIL_REGEX } from "../constants";
import {
  AlertChannel,
  AlertDeliveryResult,
  AlertOptions,
  EmailAlertData,
  IAlertProvider,
} from "../types";
import { createBaseProvider } from "./baseProvider";
import { isEmailConfigured, sendEmail } from "../infrastructure/emailClient";
import {
  generateAlertEmailHtml,
  generateAlertEmailText,
  generateAlertEmailSubject,
} from "../templates/alertEmail";

/**
 * Validate email format
 */
function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

/**
 * Build email data from alert options
 */
function buildEmailData(options: AlertOptions): EmailAlertData {
  const { signal, change, pulseId, destination } = options;

  return {
    to: destination,
    signalName: signal.name,
    signalUrl: signal.url,
    changeSummary: change.summary,
    changeType: change.changeType!,
    items: {
      added: change.details.added,
      removed: change.details.removed,
    },
    pulseId,
  };
}

/**
 * Send email alert
 */
async function sendEmailAlert(
  options: AlertOptions
): Promise<Result<AlertDeliveryResult>> {
  const emailData = buildEmailData(options);

  const subject = generateAlertEmailSubject(emailData);
  const html = generateAlertEmailHtml(emailData);
  const text = generateAlertEmailText(emailData);

  await sendEmail({
    to: emailData.to,
    subject,
    html,
    text,
  });

  return ok({
    success: true,
    channel: AlertChannel.EMAIL,
    destination: options.destination,
    deliveredAt: new Date(),
    dryRun: false,
  });
}

/**
 * Create an email alert provider
 */
export function createEmailProvider(): IAlertProvider {
  return createBaseProvider({
    channel: AlertChannel.EMAIL,
    validateDestinationFn: validateEmail,
    sendFn: sendEmailAlert,
  });
}

/**
 * Check if email provider is available
 */
export function isEmailProviderAvailable(): boolean {
  return isEmailConfigured();
}

// Export singleton instance
export const emailProvider = createEmailProvider();
