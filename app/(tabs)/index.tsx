import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useBudget } from "@/lib/budget-context";
import { useSubscription } from "@/lib/subscription-context";
import { AddTransactionModal } from "@/components/add-transaction-modal";
import { SubscriptionModal } from "@/components/subscription-modal";
import { EditBalanceModal } from "@/components/edit-balance-modal";
import { LinkedCard } from "@/lib/storage";
import { Transaction, getOnboardingDone, getStreakData, recordActivity, setOnboardingDone } from "@/lib/storage";
import { FinancialHealthScore, useHealthScore } from "@/components/financial-health-score";
import { CountUpNumber, StreakBadge } from "@/components/celebrations";
import { SmartTips } from "@/components/smart-tips";
import { ChallengesSection } from "@/components/savings-challenges";
import { AnimatedHeader } from "@/components/animated-header";
import { AnimatedCard } from "@/components/animated-card";
import { TipOfTheDay } from "@/components/tip-of-the-day";
import { LandingPage } from "@/components/landing-page";
import * as Haptics from "expo-haptics";

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { state } = useBudget();
  const { state: subState, isPremium } = useSubscription();
  const healthScore = useHealthScore();
  const [showAddTx, setShowAddTx] = useState(false);
  const [showSub, setShowSub] = useState(false);
  const [editingCard, setEditingCard] = useState<LinkedCard | null>(null);
  const [streak, setStreak] = useState(0);
  const [showLanding, setShowLanding] = useState(Platform.OS === "web");

  // On native, redirect to onboarding if not done
  useEffect(() => {
    if (Platform.OS !== "web") {
      getOnboardingDone().then((done) => {
        if (!done) router.replace("/onboarding" as any);
      });
    }
  }, []);

  // Record daily activity for streak
  useEffect(() => {
    recordActivity().then((data) => setStreak(data.currentStreak));
  }, []);

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const { totalBalance, monthlyIncome, monthlyExpenses, recentTransactions } = useMemo(() => {
    const allTx = state.transactions;
    const monthTx = allTx.filter((t) => t.date.startsWith(currentMonth));
    const income = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expenses = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const balance = allTx.reduce((s, t) => (t.type === "income" ? s + t.amount : s - t.amount), 0);
    return {
      totalBalance: balance,
      monthlyIncome: income,
      monthlyExpenses: expenses,
      recentTransactions: allTx.slice(0, 5),
    };
  }, [state.transactions, currentMonth]);

  const budgetCategories = useMemo(
    () => state.budgetCategories.filter((c) => c.month === currentMonth).slice(0, 3),
    [state.budgetCategories, currentMonth]
  );

  const savingsGoals = useMemo(() => state.savingsGoals.slice(0, 3), [state.savingsGoals]);

  const linkedCards = subState.linkedCards;

  const getSpentForCategory = (categoryName: string) => {
    return state.transactions
      .filter(
        (t) =>
          t.type === "expense" &&
          t.category === categoryName &&
          t.date.startsWith(currentMonth)
      )
      .reduce((s, t) => s + t.amount, 0);
  };

  const s = styles(colors);

  // Web landing page — placed after all hooks to avoid "Rendered more hooks" error
  if (showLanding && Platform.OS === "web") {
    return (
      <LandingPage
        onGetStarted={() => {
          setShowLanding(false);
        }}
      />
    );
  }

  return (
    <ScreenContainer>
      {/* Back to Landing Page banner (web only) — fixed at top, always visible */}
      {Platform.OS === "web" && (
        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.primary,
            paddingHorizontal: 20,
            paddingVertical: 14,
            gap: 8,
          }}
          onPress={() => setShowLanding(true)}
        >
          <Text style={{ color: "#fff", fontSize: 16 }}>{"\u2190"}</Text>
          <Text style={{ color: "#fff", fontSize: 15, fontWeight: "600" }}>Back to Home Page</Text>
        </TouchableOpacity>
      )}

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Animated Header */}
        <AnimatedHeader
          title="Dashboard"
          subtitle={now.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          healthColor={healthScore.color}
        />

        {/* Streak Badge */}
        {streak > 0 && (
          <AnimatedCard index={0} style={{ paddingHorizontal: 20, marginTop: 16 }}>
            <StreakBadge streak={streak} colors={colors} />
          </AnimatedCard>
        )}

        {/* Premium Banner (if not subscribed) */}
        {!isPremium && (
          <AnimatedCard index={1} style={{ marginTop: streak > 0 ? 8 : 16 }}>
            <TouchableOpacity
              style={[s.premiumBanner, { backgroundColor: "#f59e0b" + "18", borderColor: "#f59e0b" + "44" }]}
              onPress={() => setShowSub(true)}
            >
              <Text style={{ fontSize: 18 }}>⭐</Text>
              <Text style={[s.premiumBannerTxt, { color: "#f59e0b" }]}>Upgrade to Premium — Pay what you want</Text>
              <Text style={[s.premiumBannerChevron, { color: "#f59e0b" }]}>›</Text>
            </TouchableOpacity>
          </AnimatedCard>
        )}

        {/* Cards Summary (if any linked) */}
        {linkedCards.length > 0 && (
          <AnimatedCard index={2} style={{ marginTop: 8 }}>
            <View style={s.section}>
              <View style={s.sectionHeader}>
                <Text style={[s.sectionTitle, { color: colors.foreground }]}>My Cards</Text>
                <TouchableOpacity onPress={() => router.push("/profile" as any)}>
                  <Text style={[s.seeAll, { color: colors.primary }]}>Manage</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }}>
                <View style={{ flexDirection: "row", paddingHorizontal: 20, gap: 12 }}>
                  {linkedCards.map((card) => (
                    <TouchableOpacity
                      key={card.id}
                      style={[s.miniCard, { backgroundColor: card.color }]}
                      onPress={() => setEditingCard(card)}
                      activeOpacity={0.7}
                    >
                      <Text style={s.miniCardName}>{card.name}</Text>
                      <Text style={s.miniCardLast4}>••••  {card.last4}</Text>
                      <Text style={s.miniCardBalance}>
                        {formatCurrency(card.balance)}
                      </Text>
                      <Text style={s.miniCardEdit}>Tap to update</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </AnimatedCard>
        )}

        {/* Balance Card with Count-Up Animation */}
        <AnimatedCard index={3}>
          <View style={[s.balanceCard, { backgroundColor: colors.primary }]}>
            <Text style={s.balanceLabel}>Total Balance</Text>
            <CountUpNumber
              value={totalBalance}
              prefix="$"
              style={s.balanceAmount}
              duration={1000}
            />
            <View style={s.balanceRow}>
              <View style={s.balanceItem}>
                <Text style={s.balanceItemLabel}>↑ Income</Text>
                <CountUpNumber
                  value={monthlyIncome}
                  prefix="$"
                  style={s.balanceItemValue}
                  duration={800}
                />
              </View>
              <View style={[s.balanceDivider, { backgroundColor: "rgba(255,255,255,0.3)" }]} />
              <View style={s.balanceItem}>
                <Text style={s.balanceItemLabel}>↓ Expenses</Text>
                <CountUpNumber
                  value={monthlyExpenses}
                  prefix="$"
                  style={s.balanceItemValue}
                  duration={800}
                />
              </View>
            </View>
          </View>
        </AnimatedCard>

        {/* Financial Health Score */}
        <AnimatedCard index={4}>
          <FinancialHealthScore />
        </AnimatedCard>

        {/* Tip of the Day */}
        <AnimatedCard index={5}>
          <TipOfTheDay />
        </AnimatedCard>

        {/* Smart Insights */}
        <AnimatedCard index={6}>
          <SmartTips />
        </AnimatedCard>

        {/* Savings Challenges */}
        <AnimatedCard index={7}>
          <ChallengesSection compact />
        </AnimatedCard>

        {/* Budget Overview */}
        {budgetCategories.length > 0 && (
          <AnimatedCard index={8}>
            <View style={s.section}>
              <View style={s.sectionHeader}>
                <Text style={[s.sectionTitle, { color: colors.foreground }]}>Budget</Text>
                <TouchableOpacity onPress={() => router.push("/budget" as any)}>
                  <Text style={[s.seeAll, { color: colors.primary }]}>See all</Text>
                </TouchableOpacity>
              </View>
              {budgetCategories.map((cat) => {
                const spent = getSpentForCategory(cat.name);
                const pct = Math.min(spent / cat.limit, 1);
                const barColor = pct >= 1 ? colors.error : pct >= 0.75 ? colors.warning : colors.success;
                return (
                  <View key={cat.id} style={[s.budgetRow, { backgroundColor: colors.surface }]}>
                    <Text style={s.budgetIcon}>{cat.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <View style={s.budgetRowTop}>
                        <Text style={[s.budgetName, { color: colors.foreground }]}>{cat.name}</Text>
                        <Text style={[s.budgetAmt, { color: colors.muted }]}>
                          {formatCurrency(spent)} / {formatCurrency(cat.limit)}
                        </Text>
                      </View>
                      <View style={[s.progressBg, { backgroundColor: colors.border }]}>
                        <View style={[s.progressFill, { width: `${pct * 100}%`, backgroundColor: barColor }]} />
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </AnimatedCard>
        )}

        {/* Savings Goals */}
        {savingsGoals.length > 0 && (
          <AnimatedCard index={9}>
            <View style={s.section}>
              <View style={s.sectionHeader}>
                <Text style={[s.sectionTitle, { color: colors.foreground }]}>Savings Goals</Text>
                <TouchableOpacity onPress={() => router.push("/savings" as any)}>
                  <Text style={[s.seeAll, { color: colors.primary }]}>See all</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }}>
                <View style={{ flexDirection: "row", paddingHorizontal: 20, gap: 12 }}>
                  {savingsGoals.map((goal) => {
                    const pct = Math.min(goal.savedAmount / goal.targetAmount, 1);
                    return (
                      <TouchableOpacity
                        key={goal.id}
                        style={[s.goalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        onPress={() => router.push("/savings" as any)}
                      >
                        <View style={[s.goalRingBg, { borderColor: colors.border }]}>
                          <View
                            style={[
                              s.goalRingFill,
                              {
                                borderColor: colors.accent,
                                borderTopColor: pct > 0.25 ? colors.accent : "transparent",
                                borderRightColor: pct > 0.5 ? colors.accent : "transparent",
                                borderBottomColor: pct > 0.75 ? colors.accent : "transparent",
                              },
                            ]}
                          />
                          <Text style={[s.goalPct, { color: colors.accent }]}>{Math.round(pct * 100)}%</Text>
                        </View>
                        <Text style={[s.goalName, { color: colors.foreground }]} numberOfLines={1}>
                          {goal.name}
                        </Text>
                        <Text style={[s.goalAmt, { color: colors.muted }]}>
                          {formatCurrency(goal.savedAmount)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          </AnimatedCard>
        )}

        {/* Recent Transactions */}
        <AnimatedCard index={10}>
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={[s.sectionTitle, { color: colors.foreground }]}>Recent</Text>
              <TouchableOpacity onPress={() => router.push("/transactions" as any)}>
                <Text style={[s.seeAll, { color: colors.primary }]}>See all</Text>
              </TouchableOpacity>
            </View>
            {recentTransactions.length === 0 ? (
              <View style={[s.emptyState, { backgroundColor: colors.surface }]}>
                <Text style={{ fontSize: 32 }}>💳</Text>
                <Text style={[s.emptyText, { color: colors.muted }]}>No transactions yet</Text>
                <Text style={[s.emptySubtext, { color: colors.muted }]}>Tap + to add your first one</Text>
              </View>
            ) : (
              recentTransactions.map((tx, i) => (
                <Animated.View
                  key={tx.id}
                  entering={FadeInDown.delay(600 + i * 60).duration(300)}
                >
                  <View style={[s.txRow, { backgroundColor: colors.surface }]}>
                    <View style={[s.txIcon, { backgroundColor: tx.type === "income" ? colors.success + "22" : colors.error + "22" }]}>
                      <Text style={{ fontSize: 20 }}>{tx.categoryIcon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.txTitle, { color: colors.foreground }]}>{tx.title}</Text>
                      <Text style={[s.txDate, { color: colors.muted }]}>{formatDate(tx.date)}</Text>
                    </View>
                    <Text
                      style={[
                        s.txAmount,
                        { color: tx.type === "income" ? colors.success : colors.error },
                      ]}
                    >
                      {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                    </Text>
                  </View>
                </Animated.View>
              ))
            )}
          </View>
        </AnimatedCard>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[s.fab, { backgroundColor: colors.primary }]}
        onPress={() => {
          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setShowAddTx(true);
        }}
      >
        <Text style={s.fabIcon}>+</Text>
      </TouchableOpacity>

      <AddTransactionModal visible={showAddTx} onClose={() => setShowAddTx(false)} />
      <SubscriptionModal visible={showSub} onClose={() => setShowSub(false)} />
      <EditBalanceModal visible={!!editingCard} card={editingCard} onClose={() => setEditingCard(null)} />
    </ScreenContainer>
  );
}

const styles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    balanceCard: {
      margin: 20,
      borderRadius: 20,
      padding: 24,
    },
    balanceLabel: { color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: "500" },
    balanceAmount: { color: "#fff", fontSize: 40, fontWeight: "700", marginTop: 4, marginBottom: 20 },
    balanceRow: { flexDirection: "row", alignItems: "center" },
    balanceItem: { flex: 1, alignItems: "center" },
    balanceItemLabel: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginBottom: 2 },
    balanceItemValue: { color: "#fff", fontSize: 16, fontWeight: "600" },
    balanceDivider: { width: 1, height: 32, marginHorizontal: 16 },
    section: { paddingHorizontal: 20, marginBottom: 24 },
    sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
    sectionTitle: { fontSize: 18, fontWeight: "700" },
    seeAll: { fontSize: 14, fontWeight: "500" },
    budgetRow: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      borderRadius: 14,
      marginBottom: 8,
      gap: 12,
    },
    budgetIcon: { fontSize: 24 },
    budgetRowTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
    budgetName: { fontSize: 14, fontWeight: "600" },
    budgetAmt: { fontSize: 12 },
    progressBg: { height: 6, borderRadius: 3, overflow: "hidden" },
    progressFill: { height: 6, borderRadius: 3 },
    goalCard: {
      width: 130,
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      alignItems: "center",
      gap: 8,
    },
    goalRingBg: {
      width: 60,
      height: 60,
      borderRadius: 30,
      borderWidth: 6,
      alignItems: "center",
      justifyContent: "center",
    },
    goalRingFill: {
      position: "absolute",
      width: 60,
      height: 60,
      borderRadius: 30,
      borderWidth: 6,
    },
    goalPct: { fontSize: 14, fontWeight: "700" },
    goalName: { fontSize: 13, fontWeight: "600", textAlign: "center" },
    goalAmt: { fontSize: 12 },
    txRow: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      borderRadius: 14,
      marginBottom: 8,
      gap: 12,
    },
    txIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
    },
    txTitle: { fontSize: 14, fontWeight: "600" },
    txDate: { fontSize: 12, marginTop: 2 },
    txAmount: { fontSize: 15, fontWeight: "700" },
    emptyState: {
      alignItems: "center",
      padding: 32,
      borderRadius: 16,
      gap: 8,
    },
    emptyText: { fontSize: 16, fontWeight: "600" },
    emptySubtext: { fontSize: 13 },
    fab: {
      position: "absolute",
      bottom: 24,
      right: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
    fabIcon: { color: "#fff", fontSize: 28, fontWeight: "300", lineHeight: 32 },
    premiumBanner: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 20,
      marginBottom: 12,
      borderRadius: 14,
      borderWidth: 1.5,
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 8,
    },
    premiumBannerTxt: { flex: 1, fontSize: 13, fontWeight: "600" },
    premiumBannerChevron: { fontSize: 20 },
    miniCard: {
      width: 160,
      borderRadius: 16,
      padding: 16,
      gap: 6,
    },
    miniCardName: { color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: "600" },
    miniCardLast4: { color: "rgba(255,255,255,0.6)", fontSize: 11, letterSpacing: 2 },
    miniCardBalance: { color: "#fff", fontSize: 18, fontWeight: "700", marginTop: 4 },
    miniCardEdit: { color: "rgba(255,255,255,0.5)", fontSize: 10, marginTop: 2 },
  });
