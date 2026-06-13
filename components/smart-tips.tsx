import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useColors } from "@/hooks/use-colors";
import { useBudget } from "@/lib/budget-context";

interface Tip {
  icon: string;
  title: string;
  message: string;
  type: "positive" | "warning" | "info";
}

export function useSmartTips(): Tip[] {
  const { state } = useBudget();

  return useMemo(() => {
    const tips: Tip[] = [];
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const prevMonth = now.getMonth() === 0
      ? `${now.getFullYear() - 1}-12`
      : `${now.getFullYear()}-${String(now.getMonth()).padStart(2, "0")}`;

    const monthTx = state.transactions.filter((t) => t.date.startsWith(currentMonth));
    const prevMonthTx = state.transactions.filter((t) => t.date.startsWith(prevMonth));
    const income = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expenses = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const prevExpenses = prevMonthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

    // Tip: Savings rate
    if (income > 0 && expenses > 0) {
      const savingsRate = ((income - expenses) / income) * 100;
      if (savingsRate >= 20) {
        tips.push({
          icon: "🎯",
          title: "Great savings rate!",
          message: `You're saving ${savingsRate.toFixed(0)}% of your income this month. That's above the recommended 20%.`,
          type: "positive",
        });
      } else if (savingsRate >= 0) {
        tips.push({
          icon: "💡",
          title: "Room to save more",
          message: `You're saving ${savingsRate.toFixed(0)}% of your income. Try to reach the 20% target by cutting discretionary spending.`,
          type: "info",
        });
      } else {
        tips.push({
          icon: "⚠️",
          title: "Spending exceeds income",
          message: `You've spent $${(expenses - income).toFixed(0)} more than you earned this month. Review your expenses to get back on track.`,
          type: "warning",
        });
      }
    }

    // Tip: Month-over-month comparison
    if (prevExpenses > 0 && expenses > 0) {
      const change = ((expenses - prevExpenses) / prevExpenses) * 100;
      if (change > 20) {
        tips.push({
          icon: "📈",
          title: "Spending is up",
          message: `You've spent ${change.toFixed(0)}% more than last month. Check which categories increased.`,
          type: "warning",
        });
      } else if (change < -10) {
        tips.push({
          icon: "📉",
          title: "Spending is down!",
          message: `You've spent ${Math.abs(change).toFixed(0)}% less than last month. Keep up the great work!`,
          type: "positive",
        });
      }
    }

    // Tip: Top spending category
    const categorySpending: Record<string, { amount: number; icon: string }> = {};
    monthTx
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        if (!categorySpending[t.category]) categorySpending[t.category] = { amount: 0, icon: t.categoryIcon };
        categorySpending[t.category].amount += t.amount;
      });
    const sorted = Object.entries(categorySpending).sort((a, b) => b[1].amount - a[1].amount);
    if (sorted.length >= 2 && expenses > 0) {
      const [topCat, topData] = sorted[0];
      const pct = (topData.amount / expenses) * 100;
      if (pct > 40) {
        tips.push({
          icon: topData.icon,
          title: `${topCat} is ${pct.toFixed(0)}% of spending`,
          message: `Consider setting a budget limit for ${topCat} to keep it in check.`,
          type: "info",
        });
      }
    }

    // Tip: Budget categories near limit
    const budgets = state.budgetCategories.filter((c) => c.month === currentMonth);
    budgets.forEach((cat) => {
      const spent = monthTx
        .filter((t) => t.type === "expense" && t.category === cat.name)
        .reduce((s, t) => s + t.amount, 0);
      const ratio = spent / cat.limit;
      if (ratio >= 0.9 && ratio < 1) {
        tips.push({
          icon: "🔔",
          title: `${cat.name} almost at limit`,
          message: `You've used ${(ratio * 100).toFixed(0)}% of your ${cat.name} budget. Only $${(cat.limit - spent).toFixed(0)} left.`,
          type: "warning",
        });
      } else if (ratio >= 1) {
        tips.push({
          icon: "🚨",
          title: `${cat.name} over budget!`,
          message: `You've exceeded your ${cat.name} budget by $${(spent - cat.limit).toFixed(0)}. Try to cut back.`,
          type: "warning",
        });
      }
    });

    // Tip: Savings goals progress
    const goals = state.savingsGoals;
    goals.forEach((goal) => {
      const pct = goal.savedAmount / goal.targetAmount;
      if (pct >= 0.9 && pct < 1) {
        tips.push({
          icon: "🏁",
          title: `Almost there: ${goal.name}`,
          message: `Only $${(goal.targetAmount - goal.savedAmount).toFixed(0)} left to reach your goal!`,
          type: "positive",
        });
      }
    });

    // Tip: No transactions yet
    if (state.transactions.length === 0) {
      tips.push({
        icon: "👋",
        title: "Welcome to Budget Saver!",
        message: "Start by adding your first transaction. Tap the + button to get started.",
        type: "info",
      });
    }

    // Tip: No budget set
    if (budgets.length === 0 && state.transactions.length > 0) {
      tips.push({
        icon: "📋",
        title: "Set up a budget",
        message: "Create monthly budget categories to track your spending limits and stay on target.",
        type: "info",
      });
    }

    return tips.slice(0, 3); // Max 3 tips at a time
  }, [state.transactions, state.budgetCategories, state.savingsGoals]);
}

export function SmartTips() {
  const colors = useColors();
  const tips = useSmartTips();

  if (tips.length === 0) return null;

  const typeColors = {
    positive: colors.success,
    warning: colors.warning,
    info: colors.primary,
  };

  return (
    <View style={s.container}>
      <Text style={[s.sectionTitle, { color: colors.foreground }]}>Smart Insights</Text>
      {tips.map((tip, i) => {
        const accent = typeColors[tip.type];
        return (
          <Animated.View
            key={`${tip.title}-${i}`}
            entering={FadeInDown.delay(i * 100).duration(400)}
            style={[s.tipCard, { backgroundColor: accent + "10", borderColor: accent + "30" }]}
          >
            <Text style={s.tipIcon}>{tip.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[s.tipTitle, { color: colors.foreground }]}>{tip.title}</Text>
              <Text style={[s.tipMessage, { color: colors.muted }]}>{tip.message}</Text>
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  container: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  tipCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  tipIcon: { fontSize: 22, marginTop: 1 },
  tipTitle: { fontSize: 14, fontWeight: "700", marginBottom: 3 },
  tipMessage: { fontSize: 13, lineHeight: 18 },
});
