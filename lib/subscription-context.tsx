import React, { createContext, useCallback, useContext, useEffect, useReducer } from "react";
import { Platform } from "react-native";
import {
  Subscription,
  LinkedCard,
  SubscriptionTier,
  BillingCycle,
  getSubscription,
  saveSubscription,
  getLinkedCards,
  saveLinkedCards,
  addLinkedCard,
  deleteLinkedCard,
  updateLinkedCard,
} from "./storage";
import {
  initBillingConnection,
  endBillingConnection,
  setupPurchaseUpdateListener,
  setupPurchaseErrorListener,
  getTierFromPurchase,
  getPriceFromPurchase,
} from "./google-play-billing";

// ─── State ────────────────────────────────────────────────────────────────────

interface SubscriptionState {
  subscription: Subscription;
  linkedCards: LinkedCard[];
  isLoaded: boolean;
}

const DEFAULT_SUBSCRIPTION: Subscription = {
  tier: "free",
  monthlyAmount: 0,
  billingCycle: "monthly",
  startDate: new Date().toISOString(),
  nextBillingDate: new Date().toISOString(),
  isActive: false,
};

const initialState: SubscriptionState = {
  subscription: DEFAULT_SUBSCRIPTION,
  linkedCards: [],
  isLoaded: false,
};

// ─── Actions ──────────────────────────────────────────────────────────────────

type Action =
  | { type: "LOAD"; payload: Omit<SubscriptionState, "isLoaded"> }
  | { type: "SET_SUBSCRIPTION"; payload: Subscription }
  | { type: "ADD_CARD"; payload: LinkedCard }
  | { type: "UPDATE_CARD"; payload: LinkedCard }
  | { type: "DELETE_CARD"; payload: string };

function reducer(state: SubscriptionState, action: Action): SubscriptionState {
  switch (action.type) {
    case "LOAD":
      return { ...state, ...action.payload, isLoaded: true };
    case "SET_SUBSCRIPTION":
      return { ...state, subscription: action.payload };
    case "ADD_CARD":
      return { ...state, linkedCards: [...state.linkedCards, action.payload] };
    case "UPDATE_CARD":
      return {
        ...state,
        linkedCards: state.linkedCards.map((c) =>
          c.id === action.payload.id ? action.payload : c
        ),
      };
    case "DELETE_CARD":
      return {
        ...state,
        linkedCards: state.linkedCards.filter((c) => c.id !== action.payload),
      };
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface SubscriptionContextValue {
  state: SubscriptionState;
  /** Whether the user has an active paid subscription */
  isPremium: boolean;
  /** Whether Google Play Billing is available (Android only) */
  isAndroid: boolean;
  subscribe: (amount: number, cycle: BillingCycle) => Promise<void>;
  subscribeWithSku: (sku: string) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  changeAmount: (amount: number) => Promise<void>;
  addCard: (card: LinkedCard) => Promise<void>;
  updateCard: (card: LinkedCard) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const isAndroid = Platform.OS === "android";

  useEffect(() => {
    (async () => {
      const [subscription, linkedCards] = await Promise.all([
        getSubscription(),
        getLinkedCards(),
      ]);
      dispatch({ type: "LOAD", payload: { subscription, linkedCards } });
    })();
  }, []);

  // Initialize Google Play Billing on Android
  useEffect(() => {
    if (!isAndroid) return;

    let unsubscribePurchaseUpdate: (() => void) | null = null;
    let unsubscribePurchaseError: (() => void) | null = null;

    (async () => {
      try {
        await initBillingConnection();

        // Set up purchase update listener
        unsubscribePurchaseUpdate = setupPurchaseUpdateListener((purchase) => {
          const tier = getTierFromPurchase(purchase);
          const price = getPriceFromPurchase(purchase);

          if (tier && price) {
            const sub: Subscription = {
              tier: tier as SubscriptionTier,
              monthlyAmount: price,
              billingCycle: "monthly",
              startDate: new Date().toISOString(),
              nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              isActive: purchase.isAutoRenewing,
            };
            dispatch({ type: "SET_SUBSCRIPTION", payload: sub });
            saveSubscription(sub);
          }
        });

        // Set up purchase error listener
        unsubscribePurchaseError = setupPurchaseErrorListener((error) => {
          console.error("Purchase error:", error);
        });
      } catch (error) {
        console.error("Failed to initialize Google Play Billing:", error);
      }
    })();

    return () => {
      unsubscribePurchaseUpdate?.();
      unsubscribePurchaseError?.();
      endBillingConnection();
    };
  }, [isAndroid]);

  const isPremium = state.subscription.isActive && state.subscription.tier !== "free";

  const subscribe = useCallback(async (amount: number, cycle: BillingCycle) => {
    // For web/iOS, use the old Stripe-based logic
    const tier: SubscriptionTier =
      amount >= 12 ? "elite_plus" : amount >= 9.99 ? "elite" : amount >= 6.99 ? "premium_plus" : amount >= 4.99 ? "premium" : amount >= 2.99 ? "plus" : "basic";
    const now = new Date();
    const next = new Date(now);
    if (cycle === "monthly") {
      next.setMonth(next.getMonth() + 1);
    } else {
      next.setFullYear(next.getFullYear() + 1);
    }
    const sub: Subscription = {
      tier,
      monthlyAmount: amount,
      billingCycle: cycle,
      startDate: now.toISOString(),
      nextBillingDate: next.toISOString(),
      isActive: true,
    };
    dispatch({ type: "SET_SUBSCRIPTION", payload: sub });
    await saveSubscription(sub);
  }, []);

  const subscribeWithSku = useCallback(async (sku: string) => {
    // For Android Google Play Billing
    if (!isAndroid) {
      console.warn("subscribeWithSku is only available on Android");
      return;
    }

    try {
      const { requestSubscriptionPurchase } = await import("./google-play-billing");
      await requestSubscriptionPurchase(sku);
      // The purchase will be handled by the purchaseUpdatedListener
    } catch (error) {
      console.error("Failed to request subscription:", error);
      throw error;
    }
  }, [isAndroid]);

  const cancelSubscription = useCallback(async () => {
    const sub: Subscription = {
      ...state.subscription,
      isActive: false,
      tier: "free",
    };
    dispatch({ type: "SET_SUBSCRIPTION", payload: sub });
    await saveSubscription(sub);
  }, [state.subscription]);

  const changeAmount = useCallback(
    async (amount: number) => {
      const tier: SubscriptionTier =
        amount >= 12 ? "premium" : amount >= 6 ? "plus" : "basic";
      const sub: Subscription = { ...state.subscription, monthlyAmount: amount, tier };
      dispatch({ type: "SET_SUBSCRIPTION", payload: sub });
      await saveSubscription(sub);
    },
    [state.subscription]
  );

  const addCard = useCallback(async (card: LinkedCard) => {
    dispatch({ type: "ADD_CARD", payload: card });
    await addLinkedCard(card);
  }, []);

  const updateCard = useCallback(async (card: LinkedCard) => {
    dispatch({ type: "UPDATE_CARD", payload: card });
    await updateLinkedCard(card);
  }, []);

  const deleteCard = useCallback(async (id: string) => {
    dispatch({ type: "DELETE_CARD", payload: id });
    await deleteLinkedCard(id);
  }, []);

  return (
    <SubscriptionContext.Provider
      value={{
        state,
        isPremium,
        isAndroid,
        subscribe,
        subscribeWithSku,
        cancelSubscription,
        changeAmount,
        addCard,
        updateCard,
        deleteCard,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription(): SubscriptionContextValue {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error("useSubscription must be used within SubscriptionProvider");
  return ctx;
}
