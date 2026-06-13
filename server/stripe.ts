import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SK;
    if (!key) {
      throw new Error("STRIPE_SK environment variable is not set");
    }
    _stripe = new Stripe(key);
  }
  return _stripe;
}

/**
 * Create a Stripe Payment Intent for a one-time subscription payment.
 * In a real production app you'd use Stripe Subscriptions with recurring billing,
 * but Payment Intents work great for "pay what you want" models.
 */
export async function createPaymentIntent(
  amountInDollars: number,
  currency: string = "usd",
  metadata?: Record<string, string>
): Promise<{ clientSecret: string; paymentIntentId: string }> {
  const stripe = getStripe();
  const amountInCents = Math.round(amountInDollars * 100);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency,
    automatic_payment_methods: { enabled: true },
    metadata: metadata ?? {},
  });

  return {
    clientSecret: paymentIntent.client_secret!,
    paymentIntentId: paymentIntent.id,
  };
}

/**
 * Create a Stripe Subscription with a custom price.
 * Uses Stripe's recurring billing for monthly/annual subscriptions.
 */
export async function createSubscription(
  customerId: string,
  amountInDollars: number,
  interval: "month" | "year" = "month",
  metadata?: Record<string, string>
): Promise<{
  subscriptionId: string;
  clientSecret: string | null;
  status: string;
}> {
  const stripe = getStripe();
  const amountInCents = Math.round(amountInDollars * 100);

  // Create a price on-the-fly for "pay what you want"
  const price = await stripe.prices.create({
    unit_amount: amountInCents,
    currency: "usd",
    recurring: { interval },
    product_data: {
      name: `Budget Saver ${interval === "year" ? "Annual" : "Monthly"} - $${amountInDollars}`,
    },
  });

  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: price.id }],
    payment_behavior: "default_incomplete",
    payment_settings: {
      save_default_payment_method: "on_subscription",
    },
    expand: ["latest_invoice.payment_intent"],
    metadata: metadata ?? {},
  });

  const invoice = subscription.latest_invoice as any;
  const paymentIntent = invoice?.payment_intent as Stripe.PaymentIntent | null;

  return {
    subscriptionId: subscription.id,
    clientSecret: paymentIntent?.client_secret ?? null,
    status: subscription.status,
  };
}

/**
 * Create or retrieve a Stripe Customer for the given user.
 */
export async function getOrCreateCustomer(
  email?: string | null,
  name?: string | null,
  metadata?: Record<string, string>
): Promise<string> {
  const stripe = getStripe();

  // If we have metadata with a userId, search for existing customer
  if (metadata?.userId) {
    const existing = await stripe.customers.search({
      query: `metadata["userId"]:"${metadata.userId}"`,
    });
    if (existing.data.length > 0) {
      return existing.data[0].id;
    }
  }

  const customer = await stripe.customers.create({
    email: email ?? undefined,
    name: name ?? undefined,
    metadata: metadata ?? {},
  });

  return customer.id;
}

/**
 * Cancel a Stripe Subscription.
 */
export async function cancelSubscription(
  subscriptionId: string
): Promise<{ status: string }> {
  const stripe = getStripe();
  const subscription = await stripe.subscriptions.cancel(subscriptionId);
  return { status: subscription.status };
}

/**
 * Get a Stripe Subscription's details.
 */
export async function getSubscriptionDetails(
  subscriptionId: string
): Promise<{
  status: string;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  amount: number;
  interval: string;
}> {
  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any;
  const item = subscription.items.data[0];

  return {
    status: subscription.status,
    currentPeriodEnd: subscription.current_period_end,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    amount: (item.price.unit_amount ?? 0) / 100,
    interval: item.price.recurring?.interval ?? "month",
  };
}

/**
 * Create an ephemeral key for the Stripe Customer (needed for mobile payment sheet).
 */
export async function createEphemeralKey(
  customerId: string
): Promise<string> {
  const stripe = getStripe();
  const ephemeralKey = await stripe.ephemeralKeys.create(
    { customer: customerId },
    { apiVersion: "2024-06-20" }
  );
  return JSON.stringify(ephemeralKey);
}
