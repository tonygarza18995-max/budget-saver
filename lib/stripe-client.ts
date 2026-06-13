import { getApiBaseUrl } from "@/constants/oauth";
import * as Auth from "@/lib/_core/auth";
import { Platform } from "react-native";

/**
 * Helper to call tRPC endpoints directly via fetch (for use outside React components).
 * tRPC mutation endpoints use POST with JSON body.
 */
async function trpcMutation<T>(
  procedure: string,
  input: Record<string, unknown>
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/trpc/${procedure}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Add auth token for native platforms
  if (Platform.OS !== "web") {
    const token = await Auth.getSessionToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const resp = await fetch(url, {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify({ json: input }),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => resp.statusText);
    throw new Error(`API call failed (${resp.status}): ${errText}`);
  }

  const data = await resp.json();
  // tRPC wraps results in { result: { data: { json: ... } } }
  return data?.result?.data?.json ?? data?.result?.data ?? data;
}

/**
 * tRPC query endpoints use GET with URL-encoded input.
 */
async function trpcQuery<T>(
  procedure: string,
  input?: Record<string, unknown>
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  let url = `${baseUrl}/api/trpc/${procedure}`;

  if (input) {
    const encoded = encodeURIComponent(JSON.stringify({ json: input }));
    url += `?input=${encoded}`;
  }

  const headers: Record<string, string> = {};

  if (Platform.OS !== "web") {
    const token = await Auth.getSessionToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const resp = await fetch(url, {
    method: "GET",
    headers,
    credentials: "include",
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => resp.statusText);
    throw new Error(`API call failed (${resp.status}): ${errText}`);
  }

  const data = await resp.json();
  return data?.result?.data?.json ?? data?.result?.data ?? data;
}

// ─── Stripe Client API ───────────────────────────────────────────────────────

export interface PaymentSheetParams {
  clientSecret: string;
  ephemeralKey: string;
  customerId: string;
  paymentIntentId: string;
  publishableKey: string;
}

export interface SubscriptionResult {
  subscriptionId: string;
  clientSecret: string | null;
  status: string;
  customerId: string;
  publishableKey: string;
}

/**
 * Initialize a payment sheet for a one-time "pay what you want" payment.
 */
export async function createPaymentSheet(
  amount: number,
  email?: string,
  name?: string
): Promise<PaymentSheetParams> {
  return trpcMutation<PaymentSheetParams>("payments.createPaymentSheet", {
    amount,
    email,
    name,
  });
}

/**
 * Create a recurring subscription.
 */
export async function createStripeSubscription(
  amount: number,
  interval: "month" | "year",
  email?: string,
  name?: string
): Promise<SubscriptionResult> {
  return trpcMutation<SubscriptionResult>("payments.createSubscription", {
    amount,
    interval,
    email,
    name,
  });
}

/**
 * Cancel a subscription.
 */
export async function cancelStripeSubscription(
  subscriptionId: string
): Promise<{ status: string }> {
  return trpcMutation<{ status: string }>("payments.cancelSubscription", {
    subscriptionId,
  });
}

/**
 * Get the publishable key from the server.
 */
export async function getPublishableKey(): Promise<string> {
  const result = await trpcQuery<{ publishableKey: string }>(
    "payments.getPublishableKey"
  );
  return result.publishableKey;
}
