import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import Svg, { G, Path, Circle, Rect, Text as SvgText } from "react-native-svg";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useBudget } from "@/lib/budget-context";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CHART_SIZE = SCREEN_WIDTH - 80;
const RADIUS = CHART_SIZE / 2 - 10;
const CX = CHART_SIZE / 2;
const CY = CHART_SIZE / 2;

const CATEGORY_COLORS = [
  "#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
  "#14b8a6", "#e11d48",
];

function formatCurrency(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

interface PieSlice {
  name: string;
  amount: number;
  color: string;
  percentage: number;
}

function PieChart({ slices, total }: { slices: PieSlice[]; total: number }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  let currentAngle = 0;

  return (
    <View style={{ alignItems: "center" }}>
      <Svg width={CHART_SIZE} height={CHART_SIZE}>
        <G>
          {slices.map((slice, i) => {
            const angle = (slice.amount / total) * 360;
            const path = describeArc(CX, CY, activeIndex === i ? RADIUS + 6 : RADIUS, currentAngle, currentAngle + angle);
            currentAngle += angle;
            return (
              <Path
                key={i}
                d={path}
                fill={slice.color}
                opacity={activeIndex === null || activeIndex === i ? 1 : 0.4}
                onPress={() => setActiveIndex(activeIndex === i ? null : i)}
              />
            );
          })}
          {/* Center hole */}
          <Circle cx={CX} cy={CY} r={RADIUS * 0.52} fill="transparent" />
        </G>
        {/* Center label */}
        <SvgText
          x={CX}
          y={CY - 8}
          textAnchor="middle"
          fontSize={13}
          fill="#888"
        >
          {activeIndex !== null ? slices[activeIndex].name : "Total"}
        </SvgText>
        <SvgText
          x={CX}
          y={CY + 14}
          textAnchor="middle"
          fontSize={16}
          fontWeight="bold"
          fill="#333"
        >
          {activeIndex !== null
            ? formatCurrency(slices[activeIndex].amount)
            : formatCurrency(total)}
        </SvgText>
      </Svg>
    </View>
  );
}

function BarChart({ slices, maxAmount }: { slices: PieSlice[]; maxAmount: number }) {
  const barWidth = (SCREEN_WIDTH - 48) / Math.min(slices.length, 8) - 8;
  const chartHeight = 140;

  return (
    <Svg width={SCREEN_WIDTH - 40} height={chartHeight + 32}>
      {slices.slice(0, 8).map((slice, i) => {
        const barH = maxAmount > 0 ? (slice.amount / maxAmount) * chartHeight : 0;
        const x = i * (barWidth + 8);
        const y = chartHeight - barH;
        return (
          <G key={i}>
            <Rect
              x={x}
              y={y}
              width={barWidth}
              height={barH}
              rx={4}
              fill={slice.color}
              opacity={0.85}
            />
            <SvgText
              x={x + barWidth / 2}
              y={chartHeight + 16}
              textAnchor="middle"
              fontSize={9}
              fill="#888"
            >
              {slice.name.length > 5 ? slice.name.slice(0, 5) : slice.name}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

export default function InsightsScreen() {
  const colors = useColors();
  const { state } = useBudget();
  const [chartType, setChartType] = useState<"pie" | "bar">("pie");
  const [monthOffset, setMonthOffset] = useState(0);

  const targetDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - monthOffset);
    return d;
  }, [monthOffset]);

  const monthKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, "0")}`;
  const monthLabel = targetDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const { slices, totalExpenses, totalIncome, netSavings } = useMemo(() => {
    const monthTx = state.transactions.filter((t) => t.date.startsWith(monthKey));
    const expenses = monthTx.filter((t) => t.type === "expense");
    const income = monthTx.filter((t) => t.type === "income");

    const totalExp = expenses.reduce((s, t) => s + t.amount, 0);
    const totalInc = income.reduce((s, t) => s + t.amount, 0);

    // Group by category
    const categoryMap: Record<string, { amount: number; icon: string }> = {};
    for (const tx of expenses) {
      if (!categoryMap[tx.category]) {
        categoryMap[tx.category] = { amount: 0, icon: tx.categoryIcon };
      }
      categoryMap[tx.category].amount += tx.amount;
    }

    const sorted = Object.entries(categoryMap)
      .sort((a, b) => b[1].amount - a[1].amount)
      .map(([name, { amount }], i) => ({
        name,
        amount,
        color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
        percentage: totalExp > 0 ? (amount / totalExp) * 100 : 0,
      }));

    return {
      slices: sorted,
      totalExpenses: totalExp,
      totalIncome: totalInc,
      netSavings: totalInc - totalExp,
    };
  }, [state.transactions, monthKey]);

  const maxAmount = slices.length > 0 ? slices[0].amount : 1;
  const s = styles(colors);

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.pageHeader}>
          <Text style={[s.pageTitle, { color: colors.foreground }]}>Insights</Text>
        </View>

        {/* Month Navigator */}
        <View style={s.monthNav}>
          <TouchableOpacity onPress={() => setMonthOffset((o) => o + 1)} style={s.monthBtn}>
            <Text style={[s.monthArrow, { color: colors.primary }]}>‹</Text>
          </TouchableOpacity>
          <Text style={[s.monthLabel, { color: colors.foreground }]}>{monthLabel}</Text>
          <TouchableOpacity
            onPress={() => setMonthOffset((o) => Math.max(0, o - 1))}
            style={s.monthBtn}
          >
            <Text style={[s.monthArrow, { color: monthOffset === 0 ? colors.border : colors.primary }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Summary Cards */}
        <View style={s.summaryRow}>
          <View style={[s.summaryCard, { backgroundColor: colors.success + "18" }]}>
            <Text style={[s.summaryLabel, { color: colors.muted }]}>Income</Text>
            <Text style={[s.summaryValue, { color: colors.success }]}>{formatCurrency(totalIncome)}</Text>
          </View>
          <View style={[s.summaryCard, { backgroundColor: colors.error + "18" }]}>
            <Text style={[s.summaryLabel, { color: colors.muted }]}>Spent</Text>
            <Text style={[s.summaryValue, { color: colors.error }]}>{formatCurrency(totalExpenses)}</Text>
          </View>
          <View style={[s.summaryCard, { backgroundColor: colors.primary + "18" }]}>
            <Text style={[s.summaryLabel, { color: colors.muted }]}>Saved</Text>
            <Text style={[s.summaryValue, { color: netSavings >= 0 ? colors.primary : colors.error }]}>
              {formatCurrency(Math.abs(netSavings))}
            </Text>
          </View>
        </View>

        {slices.length === 0 ? (
          <View style={[s.emptyState, { backgroundColor: colors.surface }]}>
            <Text style={{ fontSize: 40 }}>📊</Text>
            <Text style={[s.emptyText, { color: colors.foreground }]}>No expenses yet</Text>
            <Text style={[s.emptySubtext, { color: colors.muted }]}>Add transactions to see your spending breakdown</Text>
          </View>
        ) : (
          <>
            {/* Chart Type Toggle */}
            <View style={[s.chartToggle, { backgroundColor: colors.surface }]}>
              {(["pie", "bar"] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[s.chartToggleBtn, { backgroundColor: chartType === t ? colors.primary : "transparent" }]}
                  onPress={() => setChartType(t)}
                >
                  <Text style={[s.chartToggleTxt, { color: chartType === t ? "#fff" : colors.muted }]}>
                    {t === "pie" ? "🥧  Pie" : "📊  Bar"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Chart */}
            <View style={[s.chartCard, { backgroundColor: colors.surface }]}>
              <Text style={[s.chartTitle, { color: colors.foreground }]}>Spending by Category</Text>
              {chartType === "pie" ? (
                <PieChart slices={slices} total={totalExpenses} />
              ) : (
                <View style={{ paddingTop: 8 }}>
                  <BarChart slices={slices} maxAmount={maxAmount} />
                </View>
              )}
            </View>

            {/* Legend / Category List */}
            <View style={s.section}>
              <Text style={[s.sectionTitle, { color: colors.foreground }]}>Breakdown</Text>
              {slices.map((slice, i) => (
                <View key={i} style={[s.legendRow, { backgroundColor: colors.surface }]}>
                  <View style={[s.legendDot, { backgroundColor: slice.color }]} />
                  <Text style={[s.legendName, { color: colors.foreground }]}>{slice.name}</Text>
                  <View style={s.legendRight}>
                    <Text style={[s.legendPct, { color: colors.muted }]}>{slice.percentage.toFixed(1)}%</Text>
                    <Text style={[s.legendAmt, { color: colors.foreground }]}>{formatCurrency(slice.amount)}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    pageHeader: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
    pageTitle: { fontSize: 28, fontWeight: "700" },
    monthNav: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 8,
      gap: 16,
    },
    monthBtn: { padding: 8 },
    monthArrow: { fontSize: 28, fontWeight: "300" },
    monthLabel: { fontSize: 16, fontWeight: "600", minWidth: 160, textAlign: "center" },
    summaryRow: { flexDirection: "row", paddingHorizontal: 20, gap: 10, marginBottom: 16 },
    summaryCard: { flex: 1, borderRadius: 14, padding: 12, alignItems: "center", gap: 4 },
    summaryLabel: { fontSize: 11, fontWeight: "600", textTransform: "uppercase" },
    summaryValue: { fontSize: 15, fontWeight: "700" },
    chartToggle: {
      flexDirection: "row",
      marginHorizontal: 20,
      borderRadius: 12,
      padding: 4,
      marginBottom: 12,
    },
    chartToggleBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
    chartToggleTxt: { fontSize: 13, fontWeight: "600" },
    chartCard: {
      marginHorizontal: 20,
      borderRadius: 20,
      padding: 20,
      marginBottom: 20,
      alignItems: "center",
    },
    chartTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12, alignSelf: "flex-start" },
    section: { paddingHorizontal: 20, marginBottom: 24 },
    sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
    legendRow: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      borderRadius: 14,
      marginBottom: 8,
      gap: 12,
    },
    legendDot: { width: 14, height: 14, borderRadius: 7 },
    legendName: { flex: 1, fontSize: 14, fontWeight: "500" },
    legendRight: { alignItems: "flex-end", gap: 2 },
    legendPct: { fontSize: 11 },
    legendAmt: { fontSize: 14, fontWeight: "700" },
    emptyState: {
      marginHorizontal: 20,
      borderRadius: 20,
      padding: 40,
      alignItems: "center",
      gap: 8,
    },
    emptyText: { fontSize: 16, fontWeight: "600" },
    emptySubtext: { fontSize: 13, textAlign: "center" },
  });
