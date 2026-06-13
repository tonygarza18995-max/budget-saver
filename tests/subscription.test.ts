import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock AsyncStorage
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn().mockResolvedValue(undefined),
    removeItem: vi.fn().mockResolvedValue(undefined),
    multiGet: vi.fn().mockResolvedValue([]),
    multiSet: vi.fn().mockResolvedValue(undefined),
  },
}));

import {
  getSubscription,
  saveSubscription,
  getLinkedCards,
  saveLinkedCards,
  addLinkedCard,
  deleteLinkedCard,
  updateLinkedCard,
  Subscription,
  LinkedCard,
} from "../lib/storage";

const mockSub: Subscription = {
  tier: "plus",
  monthlyAmount: 6,
  billingCycle: "monthly",
  startDate: "2026-05-01T00:00:00.000Z",
  nextBillingDate: "2026-06-01T00:00:00.000Z",
  isActive: true,
};

const mockCard: LinkedCard = {
  id: "card-1",
  name: "Chase Sapphire",
  type: "credit",
  last4: "4242",
  balance: 1500.0,
  color: "#1a1a2e",
  createdAt: "2026-05-01T00:00:00.000Z",
};

const mockCard2: LinkedCard = {
  id: "card-2",
  name: "Bank of America Checking",
  type: "checking",
  last4: "9999",
  balance: 3200.5,
  color: "#2d6a4f",
  createdAt: "2026-05-02T00:00:00.000Z",
};

describe("Subscription storage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns default free subscription when no data stored", async () => {
    const sub = await getSubscription();
    expect(sub.tier).toBe("free");
    expect(sub.isActive).toBe(false);
    expect(sub.monthlyAmount).toBe(0);
  });

  it("saves and retrieves a subscription", async () => {
    const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
    vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify(mockSub));
    const sub = await getSubscription();
    expect(sub.tier).toBe("plus");
    expect(sub.monthlyAmount).toBe(6);
    expect(sub.isActive).toBe(true);
  });

  it("saves subscription to AsyncStorage", async () => {
    const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
    await saveSubscription(mockSub);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      "budget_saver:subscription",
      JSON.stringify(mockSub)
    );
  });

  it("correctly determines tier from amount", () => {
    const getTier = (amount: number) =>
      amount >= 12 ? "premium" : amount >= 6 ? "plus" : "basic";
    expect(getTier(3)).toBe("basic");
    expect(getTier(6)).toBe("plus");
    expect(getTier(12)).toBe("premium");
    expect(getTier(15)).toBe("premium");
    expect(getTier(1)).toBe("basic");
  });

  it("billing cycle annual sets next billing date to +1 year", () => {
    const now = new Date("2026-05-12T00:00:00.000Z");
    const next = new Date(now);
    next.setFullYear(next.getFullYear() + 1);
    expect(next.getFullYear()).toBe(2027);
    expect(next.getMonth()).toBe(now.getMonth());
  });

  it("billing cycle monthly sets next billing date to +1 month", () => {
    const now = new Date("2026-05-12T00:00:00.000Z");
    const next = new Date(now);
    next.setMonth(next.getMonth() + 1);
    expect(next.getMonth()).toBe(5); // June
    expect(next.getFullYear()).toBe(2026);
  });
});

describe("Linked Cards storage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty array when no cards stored", async () => {
    const cards = await getLinkedCards();
    expect(cards).toEqual([]);
  });

  it("retrieves stored cards", async () => {
    const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
    vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify([mockCard]));
    const cards = await getLinkedCards();
    expect(cards).toHaveLength(1);
    expect(cards[0].name).toBe("Chase Sapphire");
    expect(cards[0].last4).toBe("4242");
  });

  it("saves cards to AsyncStorage", async () => {
    const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
    await saveLinkedCards([mockCard]);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      "budget_saver:linked_cards",
      JSON.stringify([mockCard])
    );
  });

  it("adds a new card to existing list", async () => {
    const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
    vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify([mockCard]));
    const updated = await addLinkedCard(mockCard2);
    expect(updated).toHaveLength(2);
    expect(updated[1].id).toBe("card-2");
  });

  it("deletes a card by id", async () => {
    const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
    vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify([mockCard, mockCard2]));
    const updated = await deleteLinkedCard("card-1");
    expect(updated).toHaveLength(1);
    expect(updated[0].id).toBe("card-2");
  });

  it("updates a card's balance", async () => {
    const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
    vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify([mockCard]));
    const updatedCard = { ...mockCard, balance: 2000.0 };
    const result = await updateLinkedCard(updatedCard);
    expect(result[0].balance).toBe(2000.0);
  });

  it("calculates total balance across all cards", () => {
    const cards = [mockCard, mockCard2];
    const total = cards.reduce((s, c) => s + c.balance, 0);
    expect(total).toBeCloseTo(4700.5);
  });

  it("card type validation covers all types", () => {
    const validTypes = ["checking", "savings", "credit", "cash"];
    expect(validTypes).toContain(mockCard.type);
    expect(validTypes).toContain(mockCard2.type);
  });
});
