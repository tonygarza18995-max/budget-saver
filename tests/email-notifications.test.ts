import { describe, it, expect } from "vitest";
import { Resend } from "resend";

describe("Email Notifications", () => {
  const OWNER_EMAIL = "antoniogarz1735@gmail.com";
  const FROM_EMAIL = "Budget Saver <onboarding@resend.dev>";

  it("should send a waitlist notification email successfully", async () => {
    const apiKey = process.env.RESEND_API_KEY;
    expect(apiKey).toBeDefined();

    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [OWNER_EMAIL],
      subject: "[TEST] Waitlist Notification - Budget Saver",
      html: `<p>This is a test waitlist notification email.</p><p>Email: test@example.com</p><p>Total signups: 5</p>`,
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.id).toBeDefined();
    expect(typeof data!.id).toBe("string");
  });

  it("should send a bug report notification email successfully", async () => {
    const apiKey = process.env.RESEND_API_KEY;
    expect(apiKey).toBeDefined();

    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [OWNER_EMAIL],
      subject: "[TEST] Bug Report Notification - Budget Saver",
      html: `<p>This is a test bug report notification.</p><p>Description: App crashes on home screen</p><p>Screen: Home</p><p>Platform: Android</p>`,
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.id).toBeDefined();
    expect(typeof data!.id).toBe("string");
  });
});
