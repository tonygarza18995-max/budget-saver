/**
 * Google Play Billing Integration for Budget Saver
 * Uses react-native-iap v15+ with the new Nitro-based API
 *
 * Fixed subscription tiers for Android:
 * - basic: $1.99/month (SKU: com.budgetsaver.sub_basic)
 * - plus: $2.99/month (SKU: com.budgetsaver.sub_plus)
 * - premium: $4.99/month (SKU: com.budgetsaver.sub_premium)
 * - premium_plus: $6.99/month (SKU: com.budgetsaver.sub_premium_plus)
 * - elite: $9.99/month (SKU: com.budgetsaver.sub_elite)
 * - elite_plus: $11.99/month (SKU: com.budgetsaver.sub_elite_plus)
 */

import {
  initConnection,
  endConnection,
  fetchProducts,
  requestPurchase,
  getAvailablePurchases,
  finishTransaction,
  purchaseUpdatedListener,
  purchaseErrorListener,
  type ProductSubscription,
  type Purchase,
  type PurchaseError,
} from "react-native-iap";
import { Platform } from "react-native";

// Subscription tier SKUs for Google Play
export const SUBSCRIPTION_SKUS = {
  basic: "com.budgetsaver.sub_basic",
  plus: "com.budgetsaver.sub_plus",
  premium: "com.budgetsaver.sub_premium",
  premium_plus: "com.budgetsaver.sub_premium_plus",
  elite: "com.budgetsaver.sub_elite",
  elite_plus: "com.budgetsaver.sub_elite_plus",
} as const;

export type SubscriptionSKU = keyof typeof SUBSCRIPTION_SKUS;

// Mapping of SKU to tier name and price
export const SKU_TO_TIER = {
  [SUBSCRIPTION_SKUS.basic]: { tier: "basic", price: 1.99 },
  [SUBSCRIPTION_SKUS.plus]: { tier: "plus", price: 2.99 },
  [SUBSCRIPTION_SKUS.premium]: { tier: "premium", price: 4.99 },
  [SUBSCRIPTION_SKUS.premium_plus]: { tier: "premium_plus", price: 6.99 },
  [SUBSCRIPTION_SKUS.elite]: { tier: "elite", price: 9.99 },
  [SUBSCRIPTION_SKUS.elite_plus]: { tier: "elite_plus", price: 11.99 },
} as const;

/**
 * Initialize the Google Play Billing connection
 * Must be called before any other billing operations
 */
export async function initBillingConnection(): Promise<void> {
  if (Platform.OS !== "android") {
    console.warn("Google Play Billing is only available on Android");
    return;
  }

  try {
    await initConnection();
    console.log("Google Play Billing connection initialized");
  } catch (error) {
    console.error("Failed to initialize Google Play Billing:", error);
    throw error;
  }
}

/**
 * Close the Google Play Billing connection
 */
export async function endBillingConnection(): Promise<void> {
  if (Platform.OS !== "android") {
    return;
  }

  try {
    await endConnection();
    console.log("Google Play Billing connection closed");
  } catch (error) {
    console.error("Failed to close Google Play Billing connection:", error);
  }
}

/**
 * Fetch available subscription products from Google Play
 */
export async function fetchSubscriptionProducts(): Promise<ProductSubscription[]> {
  if (Platform.OS !== "android") {
    console.warn("Google Play Billing is only available on Android");
    return [];
  }

  try {
    const skus = Object.values(SUBSCRIPTION_SKUS);
    const products = await fetchProducts({
      skus,
      type: "subs",
    });

    if (!products || !Array.isArray(products)) {
      console.warn("No subscription products found");
      return [];
    }

    return products as ProductSubscription[];
  } catch (error) {
    console.error("Failed to fetch subscription products:", error);
    throw error;
  }
}

/**
 * Request a subscription purchase for the given SKU
 * The purchase result will be delivered via purchaseUpdatedListener
 */
export async function requestSubscriptionPurchase(sku: string): Promise<void> {
  if (Platform.OS !== "android") {
    console.warn("Google Play Billing is only available on Android");
    return;
  }

  try {
    await requestPurchase({
      request: {
        google: { skus: [sku] },
      },
      type: "subs",
    });
  } catch (error) {
    console.error(`Failed to request subscription purchase for SKU ${sku}:`, error);
    throw error;
  }
}

/**
 * Get all available (non-consumed) purchases for the user
 * Includes active subscriptions and pending transactions
 */
export async function getAvailableSubscriptions(): Promise<Purchase[]> {
  if (Platform.OS !== "android") {
    console.warn("Google Play Billing is only available on Android");
    return [];
  }

  try {
    const purchases = await getAvailablePurchases();

    if (!purchases || !Array.isArray(purchases)) {
      return [];
    }

    // Filter to only subscription purchases from Google Play
    return purchases.filter((p) => p.store === "google") as Purchase[];
  } catch (error) {
    console.error("Failed to get available subscriptions:", error);
    throw error;
  }
}

/**
 * Finish a transaction after server-side verification
 * This removes the purchase from the queue and acknowledges it
 */
export async function finishSubscriptionTransaction(
  purchase: Purchase,
  isConsumable: boolean = false
): Promise<void> {
  if (Platform.OS !== "android") {
    console.warn("Google Play Billing is only available on Android");
    return;
  }

  try {
    await finishTransaction({
      purchase,
      isConsumable,
    });
    console.log(`Finished transaction for purchase: ${purchase.productId}`);
  } catch (error) {
    console.error("Failed to finish transaction:", error);
    throw error;
  }
}

/**
 * Set up listener for successful purchases
 * Returns an unsubscribe function
 */
export function setupPurchaseUpdateListener(
  callback: (purchase: Purchase) => void
): () => void {
  if (Platform.OS !== "android") {
    return () => {};
  }

  const subscription = purchaseUpdatedListener((purchase) => {
    console.log("Purchase updated:", purchase);
    callback(purchase);
  });

  return () => subscription.remove();
}

/**
 * Set up listener for purchase errors
 * Returns an unsubscribe function
 */
export function setupPurchaseErrorListener(
  callback: (error: PurchaseError) => void
): () => void {
  if (Platform.OS !== "android") {
    return () => {};
  }

  const subscription = purchaseErrorListener((error) => {
    console.error("Purchase error:", error);
    callback(error);
  });

  return () => subscription.remove();
}

/**
 * Get the tier information from a purchase
 */
export function getTierFromPurchase(purchase: Purchase): string | null {
  const tierInfo = SKU_TO_TIER[purchase.productId as keyof typeof SKU_TO_TIER];
  return tierInfo?.tier || null;
}

/**
 * Get the price from a purchase
 */
export function getPriceFromPurchase(purchase: Purchase): number | null {
  const tierInfo = SKU_TO_TIER[purchase.productId as keyof typeof SKU_TO_TIER];
  return tierInfo?.price || null;
}
