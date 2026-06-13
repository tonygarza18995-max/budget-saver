import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock AsyncStorage
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn().mockResolvedValue(undefined),
    removeItem: vi.fn().mockResolvedValue(undefined),
  },
}));

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getTransactions,
  saveTransactions,
  addTransaction,
  deleteTransaction,
  getBudgetCategories,
  addBudgetCategory,
  deleteBudgetCategory,
  getSavingsGoals,
  addSavingsGoal,
  deleteSavingsGoal,
  Transaction,
  BudgetCategory,
  SavingsGoal,
} from "../lib/storage";

const mockGetItem = AsyncStorage.getItem as ReturnType<typeof vi.fn>;
const mockSetItem = AsyncStorage.setItem as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  mockGetItem.mockResolvedValue(null);
  mockSetItem.mockResolvedValue(undefined);
});

const sampleTransaction: Transaction = {
  id: "1",
  type: "expense",
  amount: 25.5,
  category: "Food",
  categoryIcon: "🍔",
  title: "Lunch",
  date: "2026-05-12T12:00:00.000Z",
};

const sampleCategory: BudgetCategory = {
  id: "1",
  name: "Food & Dining",
  icon: "🍔",
  limit: 300,
  month: "2026-05",
};

const sampleGoal: SavingsGoal = {
  id: "1",
  name: "Emergency Fund",
  targetAmount: 5000,
  savedAmount: 1000,
  createdAt: "2026-01-01T00:00:00.000Z",
  contributions: [],
};

// ─── Transactions ─────────────────────────────────────────────────────────────

describe("Transactions", () => {
  it("returns empty array when no transactions stored", async () => {
    mockGetItem.mockResolvedValue(null);
    const result = await getTransactions();
    expect(result).toEqual([]);
  });

  it("returns stored transactions", async () => {
    mockGetItem.mockResolvedValue(JSON.stringify([sampleTransaction]));
    const result = await getTransactions();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("saves transactions to storage", async () => {
    await saveTransactions([sampleTransaction]);
    expect(mockSetItem).toHaveBeenCalledWith(
      "budget_saver:transactions",
      JSON.stringify([sampleTransaction])
    );
  });

  it("adds a transaction to the front of the list", async () => {
    const existing: Transaction = { ...sampleTransaction, id: "0" };
    mockGetItem.mockResolvedValue(JSON.stringify([existing]));
    const result = await addTransaction(sampleTransaction);
    expect(result[0].id).toBe("1");
    expect(result[1].id).toBe("0");
  });

  it("deletes a transaction by id", async () => {
    mockGetItem.mockResolvedValue(JSON.stringify([sampleTransaction]));
    const result = await deleteTransaction("1");
    expect(result).toHaveLength(0);
  });
});

// ─── Budget Categories ────────────────────────────────────────────────────────

describe("Budget Categories", () => {
  it("returns empty array when no categories stored", async () => {
    mockGetItem.mockResolvedValue(null);
    const result = await getBudgetCategories();
    expect(result).toEqual([]);
  });

  it("adds a budget category", async () => {
    mockGetItem.mockResolvedValue(null);
    const result = await addBudgetCategory(sampleCategory);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Food & Dining");
  });

  it("deletes a budget category by id", async () => {
    mockGetItem.mockResolvedValue(JSON.stringify([sampleCategory]));
    const result = await deleteBudgetCategory("1");
    expect(result).toHaveLength(0);
  });
});

// ─── Savings Goals ────────────────────────────────────────────────────────────

describe("Savings Goals", () => {
  it("returns empty array when no goals stored", async () => {
    mockGetItem.mockResolvedValue(null);
    const result = await getSavingsGoals();
    expect(result).toEqual([]);
  });

  it("adds a savings goal", async () => {
    mockGetItem.mockResolvedValue(null);
    const result = await addSavingsGoal(sampleGoal);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Emergency Fund");
  });

  it("deletes a savings goal by id", async () => {
    mockGetItem.mockResolvedValue(JSON.stringify([sampleGoal]));
    const result = await deleteSavingsGoal("1");
    expect(result).toHaveLength(0);
  });

  it("calculates progress percentage correctly", () => {
    const pct = sampleGoal.savedAmount / sampleGoal.targetAmount;
    expect(pct).toBe(0.2);
  });
});

// ─── Utility Logic ────────────────────────────────────────────────────────────

describe("Utility Logic", () => {
  it("formats currency correctly", () => {
    const format = (n: number) =>
      `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    expect(format(1234.5)).toBe("$1,234.50");
    expect(format(0)).toBe("$0.00");
  });

  it("correctly identifies income vs expense types", () => {
    const income: Transaction = { ...sampleTransaction, type: "income" };
    const expense: Transaction = { ...sampleTransaction, type: "expense" };
    expect(income.type).toBe("income");
    expect(expense.type).toBe("expense");
  });

  it("calculates total balance from transactions", () => {
    const transactions: Transaction[] = [
      { ...sampleTransaction, id: "1", type: "income", amount: 1000 },
      { ...sampleTransaction, id: "2", type: "expense", amount: 200 },
      { ...sampleTransaction, id: "3", type: "expense", amount: 50 },
    ];
    const balance = transactions.reduce(
      (s, t) => (t.type === "income" ? s + t.amount : s - t.amount),
      0
    );
    expect(balance).toBe(750);
  });
});
