import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TransactionType = "income" | "expense";

export type RecurrenceInterval = "weekly" | "monthly";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  categoryIcon: string;
  title: string;
  date: string; // ISO string
  note?: string;
  cardId?: string; // optional linked card id
  isRecurring?: boolean;
  recurrenceInterval?: RecurrenceInterval;
  recurringParentId?: string; // id of the original recurring transaction template
}

export interface BudgetCategory {
  id: string;
  name: string;
  icon: string;
  limit: number;
  month: string; // "YYYY-MM"
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  deadline?: string; // ISO string
  createdAt: string; // ISO string
  contributions: Contribution[];
}

export interface Contribution {
  id: string;
  amount: number;
  date: string; // ISO string
  note?: string;
}

// ─── Subscription ───────────────────────────────────────────────────────────

export type SubscriptionTier = "free" | "basic" | "plus" | "premium" | "premium_plus" | "elite" | "elite_plus";
export type BillingCycle = "monthly" | "annual";

export interface Subscription {
  tier: SubscriptionTier;
  monthlyAmount: number; // 0 for free, user-chosen for paid
  billingCycle: BillingCycle;
  startDate: string; // ISO string
  nextBillingDate: string; // ISO string
  isActive: boolean;
}

// ─── Bill Reminders ─────────────────────────────────────────────────────────

export interface BillReminder {
  id: string;
  title: string;
  amount: number;
  dueDay: number; // day of month (1-31)
  categoryIcon: string;
  isActive: boolean;
  createdAt: string;
}

// ─── Card / Account ───────────────────────────────────────────────────────────

export type CardType = "checking" | "savings" | "credit" | "cash";

export interface LinkedCard {
  id: string;
  name: string; // e.g. "Chase Sapphire"
  type: CardType;
  last4: string; // last 4 digits
  balance: number;
  color: string; // hex color for card display
  createdAt: string; // ISO string
}

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const KEYS = {
  TRANSACTIONS: "budget_saver:transactions",
  BUDGET_CATEGORIES: "budget_saver:budget_categories",
  SAVINGS_GOALS: "budget_saver:savings_goals",
  SUBSCRIPTION: "budget_saver:subscription",
  LINKED_CARDS: "budget_saver:linked_cards",
  BILL_REMINDERS: "budget_saver:bill_reminders",
  ONBOARDING_DONE: "budget_saver:onboarding_done",
  THEME_OVERRIDE: "budget_saver:theme_override",
  STREAK_DATA: "budget_saver:streak_data",
};

// ─── Streak ──────────────────────────────────────────────────────────────────

export interface StreakData {
  currentStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
  longestStreak: number;
}

export async function getStreakData(): Promise<StreakData> {
  return getItem<StreakData>(KEYS.STREAK_DATA, { currentStreak: 0, lastActiveDate: "", longestStreak: 0 });
}

export async function recordActivity(): Promise<StreakData> {
  const today = new Date().toISOString().slice(0, 10);
  const data = await getStreakData();
  if (data.lastActiveDate === today) return data; // already recorded today
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);
  let newStreak = 1;
  if (data.lastActiveDate === yesterdayStr) {
    newStreak = data.currentStreak + 1;
  }
  const updated: StreakData = {
    currentStreak: newStreak,
    lastActiveDate: today,
    longestStreak: Math.max(data.longestStreak, newStreak),
  };
  await setItem(KEYS.STREAK_DATA, updated);
  return updated;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getItem<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function setItem<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export async function getTransactions(): Promise<Transaction[]> {
  return getItem<Transaction[]>(KEYS.TRANSACTIONS, []);
}

export async function saveTransactions(transactions: Transaction[]): Promise<void> {
  await setItem(KEYS.TRANSACTIONS, transactions);
}

export async function addTransaction(transaction: Transaction): Promise<Transaction[]> {
  const existing = await getTransactions();
  const updated = [transaction, ...existing];
  await saveTransactions(updated);
  return updated;
}

export async function deleteTransaction(id: string): Promise<Transaction[]> {
  const existing = await getTransactions();
  const updated = existing.filter((t) => t.id !== id);
  await saveTransactions(updated);
  return updated;
}

// ─── Budget Categories ────────────────────────────────────────────────────────

export async function getBudgetCategories(): Promise<BudgetCategory[]> {
  return getItem<BudgetCategory[]>(KEYS.BUDGET_CATEGORIES, []);
}

export async function saveBudgetCategories(categories: BudgetCategory[]): Promise<void> {
  await setItem(KEYS.BUDGET_CATEGORIES, categories);
}

export async function addBudgetCategory(category: BudgetCategory): Promise<BudgetCategory[]> {
  const existing = await getBudgetCategories();
  const updated = [...existing, category];
  await saveBudgetCategories(updated);
  return updated;
}

export async function deleteBudgetCategory(id: string): Promise<BudgetCategory[]> {
  const existing = await getBudgetCategories();
  const updated = existing.filter((c) => c.id !== id);
  await saveBudgetCategories(updated);
  return updated;
}

// ─── Savings Goals ────────────────────────────────────────────────────────────

export async function getSavingsGoals(): Promise<SavingsGoal[]> {
  return getItem<SavingsGoal[]>(KEYS.SAVINGS_GOALS, []);
}

export async function saveSavingsGoals(goals: SavingsGoal[]): Promise<void> {
  await setItem(KEYS.SAVINGS_GOALS, goals);
}

export async function addSavingsGoal(goal: SavingsGoal): Promise<SavingsGoal[]> {
  const existing = await getSavingsGoals();
  const updated = [...existing, goal];
  await saveSavingsGoals(updated);
  return updated;
}

export async function updateSavingsGoal(updated: SavingsGoal): Promise<SavingsGoal[]> {
  const existing = await getSavingsGoals();
  const goals = existing.map((g) => (g.id === updated.id ? updated : g));
  await saveSavingsGoals(goals);
  return goals;
}

export async function deleteSavingsGoal(id: string): Promise<SavingsGoal[]> {
  const existing = await getSavingsGoals();
  const updated = existing.filter((g) => g.id !== id);
  await saveSavingsGoals(updated);
  return updated;
}

// ─── Subscription ─────────────────────────────────────────────────────────────

const DEFAULT_SUBSCRIPTION: Subscription = {
  tier: "free",
  monthlyAmount: 0,
  billingCycle: "monthly",
  startDate: new Date().toISOString(),
  nextBillingDate: new Date().toISOString(),
  isActive: false,
};

export async function getSubscription(): Promise<Subscription> {
  return getItem<Subscription>(KEYS.SUBSCRIPTION, DEFAULT_SUBSCRIPTION);
}

export async function saveSubscription(sub: Subscription): Promise<void> {
  await setItem(KEYS.SUBSCRIPTION, sub);
}

// ─── Linked Cards ─────────────────────────────────────────────────────────────

export async function getLinkedCards(): Promise<LinkedCard[]> {
  return getItem<LinkedCard[]>(KEYS.LINKED_CARDS, []);
}

export async function saveLinkedCards(cards: LinkedCard[]): Promise<void> {
  await setItem(KEYS.LINKED_CARDS, cards);
}

export async function addLinkedCard(card: LinkedCard): Promise<LinkedCard[]> {
  const existing = await getLinkedCards();
  const updated = [...existing, card];
  await saveLinkedCards(updated);
  return updated;
}

export async function updateLinkedCard(updated: LinkedCard): Promise<LinkedCard[]> {
  const existing = await getLinkedCards();
  const cards = existing.map((c) => (c.id === updated.id ? updated : c));
  await saveLinkedCards(cards);
  return cards;
}

export async function deleteLinkedCard(id: string): Promise<LinkedCard[]> {
  const existing = await getLinkedCards();
  const updated = existing.filter((c) => c.id !== id);
  await saveLinkedCards(updated);
  return updated;
}

// ─── Bill Reminders ───────────────────────────────────────────────────────────

export async function getBillReminders(): Promise<BillReminder[]> {
  return getItem<BillReminder[]>(KEYS.BILL_REMINDERS, []);
}

export async function saveBillReminders(reminders: BillReminder[]): Promise<void> {
  await setItem(KEYS.BILL_REMINDERS, reminders);
}

export async function addBillReminder(reminder: BillReminder): Promise<BillReminder[]> {
  const existing = await getBillReminders();
  const updated = [...existing, reminder];
  await saveBillReminders(updated);
  return updated;
}

export async function deleteBillReminder(id: string): Promise<BillReminder[]> {
  const existing = await getBillReminders();
  const updated = existing.filter((r) => r.id !== id);
  await saveBillReminders(updated);
  return updated;
}

export async function toggleBillReminder(id: string): Promise<BillReminder[]> {
  const existing = await getBillReminders();
  const updated = existing.map((r) => r.id === id ? { ...r, isActive: !r.isActive } : r);
  await saveBillReminders(updated);
  return updated;
}

// ─── Onboarding / Preferences ─────────────────────────────────────────────────

export async function getOnboardingDone(): Promise<boolean> {
  return getItem<boolean>(KEYS.ONBOARDING_DONE, false);
}

export async function setOnboardingDone(): Promise<void> {
  await setItem(KEYS.ONBOARDING_DONE, true);
}

export async function getThemeOverride(): Promise<"light" | "dark" | "system"> {
  return getItem<"light" | "dark" | "system">(KEYS.THEME_OVERRIDE, "system");
}

export async function saveThemeOverride(theme: "light" | "dark" | "system"): Promise<void> {
  await setItem(KEYS.THEME_OVERRIDE, theme);
}
