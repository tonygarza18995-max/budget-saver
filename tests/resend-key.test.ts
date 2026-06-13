import { describe, it, expect } from "vitest";
import { Resend } from "resend";

describe("Resend API Key Validation", () => {
  it("should have a valid RESEND_API_KEY that can send emails", async () => {
    const apiKey = process.env.RESEND_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).not.toBe("");
    expect(apiKey!.startsWith("re_")).toBe(true);

    const resend = new Resend(apiKey);
    // For a sending-only key, domains.list() returns "restricted_api_key"
    // which confirms the key is valid but restricted to sending only
    // We test by listing domains - if we get "restricted_api_key" or success, key is valid
    const { data, error } = await resend.domains.list();

    if (error) {
      // "restricted_api_key" means the key is valid but only has sending permission - this is fine
      // "missing_api_key" or "invalid_api_key" means the key is bad
      expect(error.name).not.toBe("missing_api_key");
      expect(error.name).not.toBe("invalid_api_key");
      // restricted_api_key is acceptable - it means the key works for sending
      expect(error.name).toBe("restricted_api_key");
    }
  });
});
