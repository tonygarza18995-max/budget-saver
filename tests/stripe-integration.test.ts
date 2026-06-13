import { describe, it, expect, beforeAll } from "vitest";
import Stripe from "stripe";

let stripe: Stripe;

beforeAll(() => {
  const key = process.env.STRIPE_SK;
  if (!key) throw new Error("STRIPE_SK not set");
  stripe = new Stripe(key, { apiVersion: "2026-04-22.dahlia" });
});

describe("Stripe Server Integration", () => {
  it("should create a payment intent with correct amount", async () => {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 600, // $6.00
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: { type: "test" },
    });

    expect(paymentIntent).toBeDefined();
    expect(paymentIntent.id).toMatch(/^pi_/);
    expect(paymentIntent.amount).toBe(600);
    expect(paymentIntent.currency).toBe("usd");
    expect(paymentIntent.client_secret).toBeTruthy();
    expect(paymentIntent.status).toBe("requires_payment_method");

    // Clean up
    await stripe.paymentIntents.cancel(paymentIntent.id);
  });

  it("should create a customer", async () => {
    const customer = await stripe.customers.create({
      email: "test@budgetsaver.app",
      name: "Test User",
      metadata: { source: "vitest" },
    });

    expect(customer).toBeDefined();
    expect(customer.id).toMatch(/^cus_/);
    expect(customer.email).toBe("test@budgetsaver.app");

    // Clean up
    await stripe.customers.del(customer.id);
  });

  it("should create an ephemeral key for a customer", async () => {
    const customer = await stripe.customers.create({
      email: "ephemeral-test@budgetsaver.app",
      metadata: { source: "vitest" },
    });

    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: "2026-04-22.dahlia" }
    );

    expect(ephemeralKey).toBeDefined();
    expect(ephemeralKey.id).toMatch(/^ephkey_/);
    expect(ephemeralKey.secret).toBeTruthy();

    // Clean up
    await stripe.customers.del(customer.id);
  });

  it("should create a price with recurring billing", async () => {
    const price = await stripe.prices.create({
      unit_amount: 1200, // $12.00
      currency: "usd",
      recurring: { interval: "month" },
      product_data: {
        name: "Budget Saver Test Monthly - $12",
      },
    });

    expect(price).toBeDefined();
    expect(price.id).toMatch(/^price_/);
    expect(price.unit_amount).toBe(1200);
    expect(price.recurring?.interval).toBe("month");
    expect(price.active).toBe(true);

    // Archive the product (which also deactivates its default price)
    const productId = typeof price.product === 'string' ? price.product : price.product.id;
    await stripe.products.update(productId, { active: false });
  });

  it("should retrieve account balance", async () => {
    const balance = await stripe.balance.retrieve();

    expect(balance).toBeDefined();
    expect(balance.object).toBe("balance");
    expect(balance.available).toBeDefined();
    expect(Array.isArray(balance.available)).toBe(true);
  });
});
