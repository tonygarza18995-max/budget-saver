import { Resend } from "resend";

// Owner email — where notifications are sent
const OWNER_EMAIL = "antoniogarz1735@gmail.com";

// Sender address — using Resend's free onboarding domain (no custom domain needed)
const FROM_EMAIL = "Budget Saver <onboarding@resend.dev>";

// Initialize Resend client
function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[Email] RESEND_API_KEY not set — email notifications disabled");
    return null;
  }
  return new Resend(apiKey);
}

/**
 * Send an email notification to the app owner.
 * Non-blocking — errors are logged but don't throw.
 */
export async function sendOwnerEmail(subject: string, htmlBody: string): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) return false;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [OWNER_EMAIL],
      subject,
      html: htmlBody,
    });

    if (error) {
      console.error("[Email] Resend error:", error);
      return false;
    }

    console.log("[Email] Sent successfully, id:", data?.id);
    return true;
  } catch (err) {
    console.error("[Email] Failed to send:", err);
    return false;
  }
}

/**
 * Notify owner about a new waitlist signup.
 */
export async function emailWaitlistNotification(email: string, totalCount: number): Promise<boolean> {
  const subject = `New Waitlist Signup - Budget Saver`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #0a7ea4; margin-bottom: 16px;">New Waitlist Signup!</h2>
      <div style="background: #f0f9ff; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
        <p style="margin: 0 0 8px 0; font-size: 16px;"><strong>Email:</strong> ${email}</p>
        <p style="margin: 0; font-size: 14px; color: #666;">Total waitlist signups: <strong>${totalCount}</strong></p>
      </div>
      <p style="font-size: 12px; color: #999; margin-top: 24px;">— Budget Saver Notifications</p>
    </div>
  `;
  return sendOwnerEmail(subject, html);
}

/**
 * Notify owner about a new bug report submission.
 */
export async function emailBugReportNotification(params: {
  description: string;
  screen?: string;
  platform?: string;
  email?: string;
}): Promise<boolean> {
  const { description, screen, platform, email } = params;
  const subject = `New Bug Report - Budget Saver`;

  const details: string[] = [];
  if (screen) details.push(`<p style="margin: 4px 0;"><strong>Screen:</strong> ${screen}</p>`);
  if (platform) details.push(`<p style="margin: 4px 0;"><strong>Platform:</strong> ${platform}</p>`);
  if (email) details.push(`<p style="margin: 4px 0;"><strong>Contact:</strong> <a href="mailto:${email}">${email}</a></p>`);

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #ef4444; margin-bottom: 16px;">New Bug Report</h2>
      <div style="background: #fef2f2; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
        <p style="margin: 0 0 12px 0; font-size: 15px; line-height: 1.5;">${description}</p>
        ${details.length > 0 ? `<hr style="border: none; border-top: 1px solid #fecaca; margin: 12px 0;" />${details.join("")}` : ""}
      </div>
      <p style="font-size: 12px; color: #999; margin-top: 24px;">— Budget Saver Notifications</p>
    </div>
  `;
  return sendOwnerEmail(subject, html);
}
