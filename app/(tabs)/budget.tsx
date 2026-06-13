import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useBudget } from "@/lib/budget-context";
import { AddBudgetModal } from "@/components/add-budget-modal";
import * as Haptics from "expo-haptics";

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getMonthLabel(month: string): string {
  const [year, m] = month.split("-");
  const d = new Date(parseInt(year), parseInt(m) - 1, 1);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function addMonths(month: string, delta: number): string {
  const [year, m] = month.split("-").map(Number);
  const d = new Date(year, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function BudgetScreen() {
  const colors = useColors();
  const { state, deleteBudgetCategory } = useBudget();
  const [showAddBudget, setShowAddBudget] = useState(false);

  const now = new Date();
  const todayMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [selectedMonth, setSelectedMonth] = useState(todayMonth);

  const categories = useMemo(
    () => state.budgetCategories.filter((c) => c.month === selectedMonth),
    [state.budgetCategories, selectedMonth]
  );

  const getSpent = (categoryName: string) =>
    state.transactions
      .filter(
        (t) =>
          t.type === "expense" &&
          t.category === categoryName &&
          t.date.startsWith(selectedMonth)
      )
      .reduce((s, t) => s + t.amount, 0);

  const totalBudgeted = categories.reduce((s, c) => s + c.limit, 0);
  const totalSpent = categories.reduce((s, c) => s + getSpent(c.name), 0);

  const handleDelete = (id: string) => {
    Alert.alert("Delete Category", "Remove this budget category?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteBudgetCategory(id);
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  const s = styles(colors);

  return (
    <ScreenContainer>
      <View style={s.pageHeader}>
        <Text style={[s.pageTitle, { color: colors.foreground }]}>Budget</Text>
      </View>

      {/* Month Selector */}
      <View style={s.monthRow}>
        <TouchableOpacity
          style={[s.monthBtn, { backgroundColor: colors.surface }]}
          onPress={() => setSelectedMonth(addMonths(selectedMonth, -1))}
        >
          <Text style={[s.monthArrow, { color: colors.foreground }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[s.monthLabel, { color: colors.foreground }]}>{getMonthLabel(selectedMonth)}</Text>
        <TouchableOpacity
          style={[s.monthBtn, { backgroundColor: colors.surface }]}
          onPress={() => setSelectedMonth(addMonths(selectedMonth, 1))}
        >
          <Text style={[s.monthArrow, { color: colors.foreground }]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Card */}
      {categories.length > 0 && (
        <View style={[s.summaryCard, { backgroundColor: colors.surface }]}>
          <View style={s.summaryItem}>
            <Text style={[s.summaryLabel, { color: colors.muted }]}>Budgeted</Text>
            <Text style={[s.summaryValue, { color: colors.foreground }]}>{formatCurrency(totalBudgeted)}</Text>
          </View>
          <View style={[s.summaryDivider, { backgroundColor: colors.border }]} />
          <View style={s.summaryItem}>
            <Text style={[s.summaryLabel, { color: colors.muted }]}>Spent</Text>
            <Text style={[s.summaryValue, { color: colors.error }]}>{formatCurrency(totalSpent)}</Text>
          </View>
          <View style={[s.summaryDivider, { backgroundColor: colors.border }]} />
          <View style={s.summaryItem}>
            <Text style={[s.summaryLabel, { color: colors.muted }]}>Remaining</Text>
            <Text
              style={[
                s.summaryValue,
                { color: totalBudgeted - totalSpent >= 0 ? colors.success : colors.error },
              ]}
            >
              {formatCurrency(Math.abs(totalBudgeted - totalSpent))}
            </Text>
          </View>
        </View>
      )}

      {categories.length === 0 ? (
        <View style={s.emptyState}>
          <Text style={{ fontSize: 48 }}>📊</Text>
          <Text style={[s.emptyText, { color: colors.muted }]}>No budgets yet</Text>
          <Text style={[s.emptySubtext, { color: colors.muted }]}>Tap + to set a budget category</Text>
        </View>
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          renderItem={({ item: cat }) => {
            const spent = getSpent(cat.name);
            const pct = Math.min(spent / cat.limit, 1);
            const barColor = pct >= 1 ? colors.error : pct >= 0.75 ? colors.warning : colors.success;
            const remaining = cat.limit - spent;

            return (
              <TouchableOpacity
                style={[s.catCard, { backgroundColor: colors.surface }]}
                onLongPress={() => handleDelete(cat.id)}
                delayLongPress={400}
              >
                <View style={s.catTop}>
                  <View style={s.catLeft}>
                    <View style={[s.catIconBg, { backgroundColor: barColor + "22" }]}>
                      <Text style={{ fontSize: 22 }}>{cat.icon}</Text>
                    </View>
                    <View>
                      <Text style={[s.catName, { color: colors.foreground }]}>{cat.name}</Text>
                      <Text style={[s.catSub, { color: colors.muted }]}>
                        {formatCurrency(spent)} of {formatCurrency(cat.limit)}
                      </Text>
                    </View>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={[s.catPct, { color: barColor }]}>{Math.round(pct * 100)}%</Text>
                    <Text style={[s.catRemaining, { color: remaining >= 0 ? colors.success : colors.error }]}>
                      {remaining >= 0 ? `${formatCurrency(remaining)} left` : `${formatCurrency(Math.abs(remaining))} over`}
                    </Text>
                  </View>
                </View>
                <View style={[s.progressBg, { backgroundColor: colors.border }]}>
                  <View style={[s.progressFill, { width: `${pct * 100}%`, backgroundColor: barColor }]} />
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={[s.fab, { backgroundColor: colors.primary }]}
        onPress={() => {
          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setShowAddBudget(true);
        }}
      >
        <Text style={s.fabIcon}>+</Text>
      </TouchableOpacity>

      <AddBudgetModal
        visible={showAddBudget}
        onClose={() => setShowAddBudget(false)}
        currentMonth={selectedMonth}
      />
    </ScreenContainer>
  );
}

const styles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    pageHeader: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
    pageTitle: { fontSize: 28, fontWeight: "700" },
    monthRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    monthBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    monthArrow: { fontSize: 22, fontWeight: "300" },
    monthLabel: { fontSize: 16, fontWeight: "600" },
    summaryCard: {
      flexDirection: "row",
      marginHorizontal: 20,
      marginBottom: 16,
      borderRadius: 16,
      padding: 16,
    },
    summaryItem: { flex: 1, alignItems: "center" },
    summaryLabel: { fontSize: 12, marginBottom: 4 },
    summaryValue: { fontSize: 16, fontWeight: "700" },
    summaryDivider: { width: 1, marginVertical: 4 },
    catCard: {
      padding: 16,
      borderRadius: 16,
      marginBottom: 12,
    },
    catTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    catLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
    catIconBg: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
    },
    catName: { fontSize: 15, fontWeight: "600" },
    catSub: { fontSize: 12, marginTop: 2 },
    catPct: { fontSize: 16, fontWeight: "700" },
    catRemaining: { fontSize: 11, marginTop: 2 },
    progressBg: { height: 8, borderRadius: 4, overflow: "hidden" },
    progressFill: { height: 8, borderRadius: 4 },
    emptyState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    emptyText: { fontSize: 18, fontWeight: "600" },
    emptySubtext: { fontSize: 14 },
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
  });
