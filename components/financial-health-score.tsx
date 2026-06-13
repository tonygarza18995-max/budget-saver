import React, { useEffect, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
  useAnimatedStyle,
  withDelay,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import { useColors } from "@/hooks/use-colors";
import { useBudget } from "@/lib/budget-context";
import { useSubscription } from "@/lib/subscription-context";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SIZE = 160;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export interface HealthScoreData {
  score: number;
  label: string;
  color: string;
  breakdown: { name: string; points: number; max: number }[];
}

export function useHealthScore(): HealthScoreData {
  const { state } = useBudget();
  const { state: subState } = useSubscription();
  const colors = useColors();

  return useMemo(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const monthTx = state.transactions.filter((t) => t.date.startsWith(currentMonth));
    const income = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expenses = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

    // 1. Budget adherence (0-30 points)
    const budgets = state.budgetCategories.filter((c) => c.month === currentMonth);
    let budgetScore = 0;
    if (budgets.length > 0) {
      const budgetRatios = budgets.map((cat) => {
        const spent = monthTx
          .filter((t) => t.type === "expense" && t.category === cat.name)
          .reduce((s, t) => s + t.amount, 0);
        return Math.min(spent / cat.limit, 1.5);
      });
      const avgRatio = budgetRatios.reduce((a, b) => a + b, 0) / budgetRatios.length;
      if (avgRatio <= 0.8) budgetScore = 30;
      else if (avgRatio <= 1.0) budgetScore = 20;
      else if (avgRatio <= 1.2) budgetScore = 10;
      else budgetScore = 5;
    } else {
      budgetScore = 10; // no budgets set = partial credit
    }

    // 2. Savings progress (0-30 points)
    const goals = state.savingsGoals;
    let savingsScore = 0;
    if (goals.length > 0) {
      const avgProgress = goals.reduce((s, g) => s + Math.min(g.savedAmount / g.targetAmount, 1), 0) / goals.length;
      savingsScore = Math.round(avgProgress * 30);
    } else {
      savingsScore = 5; // no goals = partial credit
    }

    // 3. Income vs expenses ratio (0-25 points)
    let ratioScore = 0;
    if (income > 0) {
      const savingsRate = (income - expenses) / income;
      if (savingsRate >= 0.3) ratioScore = 25;
      else if (savingsRate >= 0.2) ratioScore = 20;
      else if (savingsRate >= 0.1) ratioScore = 15;
      else if (savingsRate >= 0) ratioScore = 10;
      else ratioScore = 3;
    } else if (expenses === 0) {
      ratioScore = 12; // no data
    } else {
      ratioScore = 3; // spending with no income
    }

    // 4. Tracking consistency (0-15 points)
    let consistencyScore = 0;
    const totalTx = state.transactions.length;
    if (totalTx >= 20) consistencyScore = 15;
    else if (totalTx >= 10) consistencyScore = 12;
    else if (totalTx >= 5) consistencyScore = 8;
    else if (totalTx >= 1) consistencyScore = 4;
    else consistencyScore = 0;

    const total = budgetScore + savingsScore + ratioScore + consistencyScore;
    const score = Math.min(Math.max(total, 0), 100);

    let label: string;
    let color: string;
    if (score >= 80) { label = "Excellent"; color = colors.success; }
    else if (score >= 60) { label = "Good"; color = "#22d3ee"; }
    else if (score >= 40) { label = "Fair"; color = colors.warning; }
    else { label = "Needs Work"; color = colors.error; }

    return {
      score,
      label,
      color,
      breakdown: [
        { name: "Budget", points: budgetScore, max: 30 },
        { name: "Savings", points: savingsScore, max: 30 },
        { name: "Income Ratio", points: ratioScore, max: 25 },
        { name: "Consistency", points: consistencyScore, max: 15 },
      ],
    };
  }, [state.transactions, state.budgetCategories, state.savingsGoals, colors]);
}

export function FinancialHealthScore() {
  const colors = useColors();
  const { score, label, color, breakdown } = useHealthScore();

  const animatedScore = useSharedValue(0);
  const strokeOffset = useSharedValue(CIRCUMFERENCE);

  useEffect(() => {
    animatedScore.value = withTiming(score, { duration: 1200, easing: Easing.out(Easing.cubic) });
    strokeOffset.value = withDelay(
      100,
      withTiming(CIRCUMFERENCE * (1 - score / 100), { duration: 1200, easing: Easing.out(Easing.cubic) })
    );
  }, [score]);

  const animatedCircleProps = useAnimatedProps(() => ({
    strokeDashoffset: strokeOffset.value,
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: withTiming(1, { duration: 600 }),
  }));

  return (
    <View style={[s.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={s.header}>
        <Text style={[s.title, { color: colors.foreground }]}>Financial Health</Text>
        <View style={[s.badge, { backgroundColor: color + "22" }]}>
          <Text style={[s.badgeText, { color }]}>{label}</Text>
        </View>
      </View>

      <View style={s.ringContainer}>
        <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          {/* Background ring */}
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={colors.border}
            strokeWidth={STROKE}
            fill="none"
          />
          {/* Animated progress ring */}
          <AnimatedCircle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={color}
            strokeWidth={STROKE}
            fill="none"
            strokeDasharray={CIRCUMFERENCE}
            animatedProps={animatedCircleProps}
            strokeLinecap="round"
            rotation="-90"
            origin={`${SIZE / 2}, ${SIZE / 2}`}
          />
        </Svg>
        <Animated.View style={[s.scoreOverlay, animatedTextStyle]}>
          <Text style={[s.scoreNumber, { color: colors.foreground }]}>{score}</Text>
          <Text style={[s.scoreLabel, { color: colors.muted }]}>/ 100</Text>
        </Animated.View>
      </View>

      {/* Breakdown bars */}
      <View style={s.breakdownContainer}>
        {breakdown.map((item) => {
          const pct = item.points / item.max;
          return (
            <View key={item.name} style={s.breakdownRow}>
              <Text style={[s.breakdownName, { color: colors.muted }]}>{item.name}</Text>
              <View style={[s.breakdownBarBg, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    s.breakdownBarFill,
                    { width: `${pct * 100}%`, backgroundColor: color },
                  ]}
                />
              </View>
              <Text style={[s.breakdownPts, { color: colors.foreground }]}>
                {item.points}/{item.max}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: "700" },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: "700" },
  ringContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  scoreOverlay: {
    position: "absolute",
    alignItems: "center",
  },
  scoreNumber: { fontSize: 44, fontWeight: "800" },
  scoreLabel: { fontSize: 14, fontWeight: "500", marginTop: -4 },
  breakdownContainer: { gap: 10 },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  breakdownName: { fontSize: 12, fontWeight: "500", width: 80 },
  breakdownBarBg: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  breakdownBarFill: { height: 6, borderRadius: 3 },
  breakdownPts: { fontSize: 12, fontWeight: "600", width: 36, textAlign: "right" },
});
