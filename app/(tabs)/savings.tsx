import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useBudget } from "@/lib/budget-context";
import { AddSavingsModal } from "@/components/add-savings-modal";
import { SavingsGoal } from "@/lib/storage";
import * as Haptics from "expo-haptics";

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function motivationalText(pct: number): string {
  if (pct >= 1) return "Goal reached! 🎉";
  if (pct >= 0.75) return "Almost there! Keep going!";
  if (pct >= 0.5) return "Halfway there!";
  if (pct >= 0.25) return "Great start!";
  return "Just getting started!";
}

export default function SavingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { state, deleteSavingsGoal } = useBudget();
  const [showAddSavings, setShowAddSavings] = useState(false);

  const totalSaved = state.savingsGoals.reduce((s, g) => s + g.savedAmount, 0);

  const handleDelete = (id: string) => {
    Alert.alert("Delete Goal", "Remove this savings goal?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteSavingsGoal(id);
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  const s = styles(colors);

  const renderGoal = ({ item: goal }: { item: SavingsGoal }) => {
    const pct = goal.targetAmount > 0 ? Math.min(goal.savedAmount / goal.targetAmount, 1) : 0;
    const remaining = goal.targetAmount - goal.savedAmount;
    const ringColor = pct >= 1 ? colors.success : colors.accent;

    return (
      <TouchableOpacity
        style={[s.goalCard, { backgroundColor: colors.surface }]}
        onPress={() => router.push({ pathname: "/savings/[id]", params: { id: goal.id } } as any)}
        onLongPress={() => handleDelete(goal.id)}
        delayLongPress={400}
      >
        <View style={s.goalTop}>
          {/* Progress Ring */}
          <View style={s.ringContainer}>
            <View style={[s.ringOuter, { borderColor: colors.border }]}>
              <View
                style={[
                  s.ringProgress,
                  {
                    borderColor: ringColor,
                    transform: [{ rotate: `${pct * 360}deg` }],
                  },
                ]}
              />
              <View style={[s.ringInner, { backgroundColor: colors.surface }]}>
                <Text style={[s.ringPct, { color: ringColor }]}>{Math.round(pct * 100)}%</Text>
              </View>
            </View>
          </View>

          {/* Goal Info */}
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={[s.goalName, { color: colors.foreground }]}>{goal.name}</Text>
            <Text style={[s.motivational, { color: colors.muted }]}>{motivationalText(pct)}</Text>
            <View style={s.amountRow}>
              <View>
                <Text style={[s.amtLabel, { color: colors.muted }]}>Saved</Text>
                <Text style={[s.amtValue, { color: colors.success }]}>{formatCurrency(goal.savedAmount)}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={[s.amtLabel, { color: colors.muted }]}>Target</Text>
                <Text style={[s.amtValue, { color: colors.foreground }]}>{formatCurrency(goal.targetAmount)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={[s.progressBg, { backgroundColor: colors.border }]}>
          <View style={[s.progressFill, { width: `${pct * 100}%`, backgroundColor: ringColor }]} />
        </View>

        {remaining > 0 && (
          <Text style={[s.remaining, { color: colors.muted }]}>
            {formatCurrency(remaining)} remaining
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer>
      <View style={s.pageHeader}>
        <Text style={[s.pageTitle, { color: colors.foreground }]}>Savings</Text>
      </View>

      {/* Total Saved Banner */}
      {state.savingsGoals.length > 0 && (
        <View style={[s.totalBanner, { backgroundColor: colors.accent + "18" }]}>
          <Text style={[s.totalLabel, { color: colors.accent }]}>Total Saved Across All Goals</Text>
          <Text style={[s.totalAmount, { color: colors.accent }]}>{formatCurrency(totalSaved)}</Text>
        </View>
      )}

      {state.savingsGoals.length === 0 ? (
        <View style={s.emptyState}>
          <Text style={{ fontSize: 48 }}>🎯</Text>
          <Text style={[s.emptyText, { color: colors.muted }]}>No savings goals yet</Text>
          <Text style={[s.emptySubtext, { color: colors.muted }]}>Tap + to create your first goal</Text>
        </View>
      ) : (
        <FlatList
          data={state.savingsGoals}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          renderItem={renderGoal}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={[s.fab, { backgroundColor: colors.accent }]}
        onPress={() => {
          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setShowAddSavings(true);
        }}
      >
        <Text style={s.fabIcon}>+</Text>
      </TouchableOpacity>

      <AddSavingsModal visible={showAddSavings} onClose={() => setShowAddSavings(false)} />
    </ScreenContainer>
  );
}

const styles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    pageHeader: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
    pageTitle: { fontSize: 28, fontWeight: "700" },
    totalBanner: {
      marginHorizontal: 20,
      marginBottom: 16,
      borderRadius: 16,
      padding: 16,
      alignItems: "center",
    },
    totalLabel: { fontSize: 13, fontWeight: "500", marginBottom: 4 },
    totalAmount: { fontSize: 28, fontWeight: "700" },
    goalCard: {
      padding: 16,
      borderRadius: 16,
      marginBottom: 12,
    },
    goalTop: { flexDirection: "row", marginBottom: 12 },
    ringContainer: { alignItems: "center", justifyContent: "center" },
    ringOuter: {
      width: 72,
      height: 72,
      borderRadius: 36,
      borderWidth: 6,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    ringProgress: {
      position: "absolute",
      width: 72,
      height: 72,
      borderRadius: 36,
      borderWidth: 6,
      borderLeftColor: "transparent",
      borderBottomColor: "transparent",
    },
    ringInner: {
      width: 52,
      height: 52,
      borderRadius: 26,
      alignItems: "center",
      justifyContent: "center",
    },
    ringPct: { fontSize: 13, fontWeight: "700" },
    goalName: { fontSize: 17, fontWeight: "700", marginBottom: 4 },
    motivational: { fontSize: 12, marginBottom: 12 },
    amountRow: { flexDirection: "row", justifyContent: "space-between" },
    amtLabel: { fontSize: 11, marginBottom: 2 },
    amtValue: { fontSize: 15, fontWeight: "600" },
    progressBg: { height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 8 },
    progressFill: { height: 8, borderRadius: 4 },
    remaining: { fontSize: 12, textAlign: "right" },
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
