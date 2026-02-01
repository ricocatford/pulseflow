import { Resend } from "resend";
import { env } from "@/lib/env";

/**
 * Email client singleton using Resend
 */
let resendClient: Resend | null = null;

/**
 * Get the Resend client instance
 */
export function getEmailClient(): Resend {
  if (!resendClient) {
    const apiKey = env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

/**
 * Check if email sending is available
 */
export function isEmailConfigured(): boolean {
  return Boolean(env.RESEND_API_KEY);
}

/**
 * Send an email using Resend
 */
export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailResult {
  id: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const client = getEmailClient();
  const from = env.EMAIL_FROM;

  const { data, error } = await client.emails.send({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.id) {
    throw new Error("Failed to send email - no ID returned");
  }

  return { id: data.id };
}
