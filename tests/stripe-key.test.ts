import { describe, it, expect } from "vitest";

describe("Stripe API Key Validation", () => {
  it("should have STRIPE_SK set in environment", () => {
    const key = process.env.STRIPE_SK;
    expect(key).toBeTruthy();
    expect(typeof key).toBe("string");
    // Stripe secret keys start with sk_test_ or sk_live_
    expect(key!.startsWith("sk_test_") || key!.startsWith("sk_live_")).toBe(true);
  });

  it("should have STRIPE_PUBLISHABLE_KEY set in environment", () => {
    const key = process.env.STRIPE_PUBLISHABLE_KEY;
    expect(key).toBeTruthy();
    expect(typeof key).toBe("string");
    // Stripe publishable keys start with pk_test_ or pk_live_
    expect(key!.startsWith("pk_test_") || key!.startsWith("pk_live_")).toBe(true);
  });

  it("should be able to initialize Stripe with the secret key", async () => {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SK!, {
      apiVersion: "2026-04-22.dahlia",
    });
    // A simple API call to verify the key works
    const balance = await stripe.balance.retrieve();
    expect(balance).toBeDefined();
    expect(balance.object).toBe("balance");
  });
});
