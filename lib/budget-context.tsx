import React, { createContext, useCallback, useContext, useEffect, useReducer } from "react";
import {
  Transaction,
  BudgetCategory,
  SavingsGoal,
  Contribution,
  getTransactions,
  saveTransactions,
  getBudgetCategories,
  saveBudgetCategories,
  getSavingsGoals,
  saveSavingsGoals,
} from "./storage";

// ─── State ────────────────────────────────────────────────────────────────────

interface BudgetState {
  transactions: Transaction[];
  budgetCategories: BudgetCategory[];
  savingsGoals: SavingsGoal[];
  isLoaded: boolean;
}

const initialState: BudgetState = {
  transactions: [],
  budgetCategories: [],
  savingsGoals: [],
  isLoaded: false,
};

// ─── Actions ──────────────────────────────────────────────────────────────────

type Action =
  | { type: "LOAD"; payload: Omit<BudgetState, "isLoaded"> }
  | { type: "ADD_TRANSACTION"; payload: Transaction }
  | { type: "DELETE_TRANSACTION"; payload: string }
  | { type: "ADD_BUDGET_CATEGORY"; payload: BudgetCategory }
  | { type: "DELETE_BUDGET_CATEGORY"; payload: string }
  | { type: "ADD_SAVINGS_GOAL"; payload: SavingsGoal }
  | { type: "UPDATE_SAVINGS_GOAL"; payload: SavingsGoal }
  | { type: "DELETE_SAVINGS_GOAL"; payload: string };

function reducer(state: BudgetState, action: Action): BudgetState {
  switch (action.type) {
    case "LOAD":
      return { ...state, ...action.payload, isLoaded: true };
    case "ADD_TRANSACTION":
      return { ...state, transactions: [action.payload, ...state.transactions] };
    case "DELETE_TRANSACTION":
      return { ...state, transactions: state.transactions.filter((t) => t.id !== action.payload) };
    case "ADD_BUDGET_CATEGORY":
      return { ...state, budgetCategories: [...state.budgetCategories, action.payload] };
    case "DELETE_BUDGET_CATEGORY":
      return { ...state, budgetCategories: state.budgetCategories.filter((c) => c.id !== action.payload) };
    case "ADD_SAVINGS_GOAL":
      return { ...state, savingsGoals: [...state.savingsGoals, action.payload] };
    case "UPDATE_SAVINGS_GOAL":
      return {
        ...state,
        savingsGoals: state.savingsGoals.map((g) => (g.id === action.payload.id ? action.payload : g)),
      };
    case "DELETE_SAVINGS_GOAL":
      return { ...state, savingsGoals: state.savingsGoals.filter((g) => g.id !== action.payload) };
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface BudgetContextValue {
  state: BudgetState;
  addTransaction: (t: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addBudgetCategory: (c: BudgetCategory) => Promise<void>;
  deleteBudgetCategory: (id: string) => Promise<void>;
  addSavingsGoal: (g: SavingsGoal) => Promise<void>;
  updateSavingsGoal: (g: SavingsGoal) => Promise<void>;
  deleteSavingsGoal: (id: string) => Promise<void>;
  addContribution: (goalId: string, contribution: Contribution) => Promise<void>;
}

const BudgetContext = createContext<BudgetContextValue | null>(null);

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load all data on mount
  useEffect(() => {
    (async () => {
      const [transactions, budgetCategories, savingsGoals] = await Promise.all([
        getTransactions(),
        getBudgetCategories(),
        getSavingsGoals(),
      ]);
      dispatch({ type: "LOAD", payload: { transactions, budgetCategories, savingsGoals } });
    })();
  }, []);

  const addTransaction = useCallback(async (t: Transaction) => {
    dispatch({ type: "ADD_TRANSACTION", payload: t });
    const current = await getTransactions();
    await saveTransactions([t, ...current]);
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    dispatch({ type: "DELETE_TRANSACTION", payload: id });
    const current = await getTransactions();
    await saveTransactions(current.filter((t) => t.id !== id));
  }, []);

  const addBudgetCategory = useCallback(async (c: BudgetCategory) => {
    dispatch({ type: "ADD_BUDGET_CATEGORY", payload: c });
    const current = await getBudgetCategories();
    await saveBudgetCategories([...current, c]);
  }, []);

  const deleteBudgetCategory = useCallback(async (id: string) => {
    dispatch({ type: "DELETE_BUDGET_CATEGORY", payload: id });
    const current = await getBudgetCategories();
    await saveBudgetCategories(current.filter((c) => c.id !== id));
  }, []);

  const addSavingsGoal = useCallback(async (g: SavingsGoal) => {
    dispatch({ type: "ADD_SAVINGS_GOAL", payload: g });
    const current = await getSavingsGoals();
    await saveSavingsGoals([...current, g]);
  }, []);

  const updateSavingsGoal = useCallback(async (g: SavingsGoal) => {
    dispatch({ type: "UPDATE_SAVINGS_GOAL", payload: g });
    const current = await getSavingsGoals();
    await saveSavingsGoals(current.map((s) => (s.id === g.id ? g : s)));
  }, []);

  const deleteSavingsGoal = useCallback(async (id: string) => {
    dispatch({ type: "DELETE_SAVINGS_GOAL", payload: id });
    const current = await getSavingsGoals();
    await saveSavingsGoals(current.filter((g) => g.id !== id));
  }, []);

  const addContribution = useCallback(async (goalId: string, contribution: Contribution) => {
    const current = await getSavingsGoals();
    const goal = current.find((g) => g.id === goalId);
    if (!goal) return;
    const updated: SavingsGoal = {
      ...goal,
      savedAmount: goal.savedAmount + contribution.amount,
      contributions: [contribution, ...goal.contributions],
    };
    dispatch({ type: "UPDATE_SAVINGS_GOAL", payload: updated });
    await saveSavingsGoals(current.map((g) => (g.id === goalId ? updated : g)));
  }, []);

  return (
    <BudgetContext.Provider
      value={{
        state,
        addTransaction,
        deleteTransaction,
        addBudgetCategory,
        deleteBudgetCategory,
        addSavingsGoal,
        updateSavingsGoal,
        deleteSavingsGoal,
        addContribution,
      }}
    >
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget(): BudgetContextValue {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error("useBudget must be used within BudgetProvider");
  return ctx;
}
