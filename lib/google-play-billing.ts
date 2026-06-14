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

// Only import react-native-iap on native platforms
let initConnection: any = async () => {};
let endConnection: any = async () => {};
let fetchProducts: any = async () => [];
let requestPurchase: any = async () => {};
let getAvailablePurchases: any = async () => [];
let finishTransaction: any = async () => {};
let purchaseUpdatedListener: any = () => () => {};
let purchaseErrorListener: any = () => () => {};

if (Platform.OS !== "web") {
  const iap = require("react-native-iap");
  initConnection = iap.initConnection;
  endConnection = iap.endConnection;
  fetchProducts = iap.fetchProducts;
  requestPurchase = iap.requestPurchase;
  getAvailablePurchases = iap.getAvailablePurchases;
  finishTransaction = iap.finishTransaction;
  purchaseUpdatedListener = iap.purchaseUpdatedListener;
  purchaseErrorListener = iap.purchaseErrorListener;
}

type ProductSubscription = any;
type Purchase = any;
type PurchaseError = any;

// ─── Initialization ────────────────────────────────────────────────────────

/**
 * Initialize the Google Play Billing connection.
 * Must be called before any other billing operations.
 */
export async function initBillingConnection(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await initConnection();
  } catch (error) {
    console.error("Failed to initialize billing connection:", error);
  }
}

/**
 * End the Google Play Billing connection.
 * Call this during cleanup (e.g., component unmount).
 */
export async function endBillingConnection(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await endConnection();
  } catch (error) {
    console.error("Failed to end billing connection:", error);
  }
}

// ─── Product Fetching ─────────────────────────────────────────────────────

/**
 * Fetch subscription products from Google Play.
 * Returns product details including prices and descriptions.
 */
export async function fetchSubscriptionProducts(): Promise<ProductSubscription[]> {
  if (Platform.OS === "web") return [];
  try {
    const skus = Object.values(SUBSCRIPTION_SKUS);
    const products = await fetchProducts({ skus });
    return products || [];
  } catch (error) {
    console.error("Failed to fetch subscription products:", error);
    return [];
  }
}

// ─── Purchase Requests ────────────────────────────────────────────────────

/**
 * Request a subscription purchase for the given SKU.
 * Launches the Google Play purchase flow.
 */
export async function requestSubscriptionPurchase(sku: SubscriptionSKU): Promise<void> {
  if (Platform.OS === "web") {
    console.warn("Google Play Billing is not available on web");
    return;
  }
  try {
    await requestPurchase({ sku, andDangerouslyFinishTransactionAutomaticallyIOS: false });
  } catch (error) {
    console.error("Failed to request subscription purchase:", error);
    throw error;
  }
}

// ─── Purchase Retrieval ───────────────────────────────────────────────────

/**
 * Get all available (active) purchases for the user.
 * Returns a list of completed purchases.
 */
export async function getActivePurchases(): Promise<Purchase[]> {
  if (Platform.OS === "web") return [];
  try {
    const purchases = await getAvailablePurchases();
    return purchases || [];
  } catch (error) {
    console.error("Failed to get available purchases:", error);
    return [];
  }
}

// ─── Purchase Acknowledgment ──────────────────────────────────────────────

/**
 * Acknowledge a purchase to Google Play.
 * Must be called after a purchase is completed to prevent refunds.
 */
export async function acknowledgePurchase(purchase: Purchase): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    if (purchase.transactionId) {
      await finishTransaction({ purchase, isConsumable: false });
    }
  } catch (error) {
    console.error("Failed to acknowledge purchase:", error);
  }
}

// ─── Event Listeners ──────────────────────────────────────────────────────

/**
 * Set up a listener for purchase updates.
 * Returns an unsubscribe function.
 */
export function setupPurchaseUpdateListener(
  callback: (purchase: Purchase) => void
): () => void {
  if (Platform.OS === "web") return () => {};
  try {
    const unsubscribe = purchaseUpdatedListener(async (purchase: Purchase) => {
      callback(purchase);
      // Acknowledge the purchase
      await acknowledgePurchase(purchase);
    });
    return unsubscribe || (() => {});
  } catch (error) {
    console.error("Failed to set up purchase update listener:", error);
    return () => {};
  }
}

/**
 * Set up a listener for purchase errors.
 * Returns an unsubscribe function.
 */
export function setupPurchaseErrorListener(
  callback: (error: PurchaseError) => void
): () => void {
  if (Platform.OS === "web") return () => {};
  try {
    const unsubscribe = purchaseErrorListener((error: PurchaseError) => {
      callback(error);
    });
    return unsubscribe || (() => {});
  } catch (error) {
    console.error("Failed to set up purchase error listener:", error);
    return () => {};
  }
}

// ─── Tier Mapping ─────────────────────────────────────────────────────────

/**
 * Map a purchase to its corresponding subscription tier.
 */
export function getTierFromPurchase(purchase: Purchase): SubscriptionSKU | null {
  if (!purchase.productId) return null;
  const skuEntry = Object.entries(SUBSCRIPTION_SKUS).find(
    ([_, sku]) => sku === purchase.productId
  );
  return skuEntry ? (skuEntry[0] as SubscriptionSKU) : null;
}

/**
 * Map a subscription tier to its monthly price.
 */
export function getPriceFromTier(tier: SubscriptionSKU): number {
  const prices: Record<SubscriptionSKU, number> = {
    basic: 1.99,
    plus: 2.99,
    premium: 4.99,
    premium_plus: 6.99,
    elite: 9.99,
    elite_plus: 11.99,
  };
  return prices[tier] || 0;
}

/**
 * Map a purchase to its monthly price.
 */
export function getPriceFromPurchase(purchase: Purchase): number {
  const tier = getTierFromPurchase(purchase);
  return tier ? getPriceFromTier(tier) : 0;
}
