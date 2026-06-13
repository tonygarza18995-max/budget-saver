import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useBudget } from "@/lib/budget-context";
import { Contribution } from "@/lib/storage";
import { Confetti, SuccessCheck } from "@/components/celebrations";
import * as Haptics from "expo-haptics";

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function SavingsDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, addContribution } = useBudget();

  const [showContrib, setShowContrib] = useState(false);
  const [contribAmount, setContribAmount] = useState("");
  const [contribNote, setContribNote] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [wasComplete, setWasComplete] = useState(false);

  const goal = state.savingsGoals.find((g) => g.id === id);

  // Track if goal was already complete before contribution
  useEffect(() => {
    if (goal) {
      setWasComplete(goal.savedAmount >= goal.targetAmount);
    }
  }, []);

  if (!goal) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: colors.muted }}>Goal not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
            <Text style={{ color: colors.primary }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  const pct = goal.targetAmount > 0 ? Math.min(goal.savedAmount / goal.targetAmount, 1) : 0;
  const remaining = goal.targetAmount - goal.savedAmount;
  const ringColor = pct >= 1 ? colors.success : colors.accent;

  const handleAddContribution = async () => {
    if (!contribAmount || parseFloat(contribAmount) <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount.");
      return;
    }
    const amount = parseFloat(contribAmount);
    const contribution: Contribution = {
      id: Date.now().toString(),
      amount,
      date: new Date().toISOString(),
      note: contribNote.trim() || undefined,
    };
    await addContribution(goal.id, contribution);

    // Check if this contribution just completed the goal
    const newTotal = goal.savedAmount + amount;
    if (!wasComplete && newTotal >= goal.targetAmount) {
      setShowConfetti(true);
      setShowSuccess(true);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setTimeout(() => setShowSuccess(false), 2500);
      setTimeout(() => setShowConfetti(false), 3500);
    } else {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }

    setContribAmount("");
    setContribNote("");
    setShowContrib(false);
  };

  const s = styles(colors);

  return (
    <ScreenContainer>
      {/* Confetti overlay */}
      <Confetti visible={showConfetti} onFinish={() => setShowConfetti(false)} />

      {/* Back Button */}
      <View style={s.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={[s.backTxt, { color: colors.primary }]}>‹ Back</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={goal.contributions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        ListHeaderComponent={
          <>
            {/* Goal Header */}
            <Text style={[s.goalName, { color: colors.foreground }]}>{goal.name}</Text>

            {/* Big Progress Ring */}
            <View style={s.ringSection}>
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
                <View style={[s.ringInner, { backgroundColor: colors.background }]}>
                  {showSuccess ? (
                    <SuccessCheck visible message="Goal reached!" />
                  ) : (
                    <>
                      <Text style={[s.ringPct, { color: ringColor }]}>{Math.round(pct * 100)}%</Text>
                      <Text style={[s.ringLabel, { color: colors.muted }]}>complete</Text>
                    </>
                  )}
                </View>
              </View>
            </View>

            {/* Completion banner */}
            {pct >= 1 && !showSuccess && (
              <View style={[s.completeBanner, { backgroundColor: colors.success + "15" }]}>
                <Text style={s.completeBannerIcon}>🎉</Text>
                <Text style={[s.completeBannerTxt, { color: colors.success }]}>
                  Congratulations! You've reached your savings goal!
                </Text>
              </View>
            )}

            {/* Stats */}
            <View style={[s.statsRow, { backgroundColor: colors.surface }]}>
              <View style={s.statItem}>
                <Text style={[s.statLabel, { color: colors.muted }]}>Saved</Text>
                <Text style={[s.statValue, { color: colors.success }]}>{formatCurrency(goal.savedAmount)}</Text>
              </View>
              <View style={[s.statDivider, { backgroundColor: colors.border }]} />
              <View style={s.statItem}>
                <Text style={[s.statLabel, { color: colors.muted }]}>Target</Text>
                <Text style={[s.statValue, { color: colors.foreground }]}>{formatCurrency(goal.targetAmount)}</Text>
              </View>
              <View style={[s.statDivider, { backgroundColor: colors.border }]} />
              <View style={s.statItem}>
                <Text style={[s.statLabel, { color: colors.muted }]}>Remaining</Text>
                <Text style={[s.statValue, { color: remaining > 0 ? colors.accent : colors.success }]}>
                  {remaining > 0 ? formatCurrency(remaining) : "Done!"}
                </Text>
              </View>
            </View>

            {/* Add Contribution Button */}
            <TouchableOpacity
              style={[s.addBtn, { backgroundColor: colors.accent }]}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowContrib(true);
              }}
            >
              <Text style={s.addBtnTxt}>+ Add Contribution</Text>
            </TouchableOpacity>

            {goal.contributions.length > 0 && (
              <Text style={[s.historyTitle, { color: colors.foreground }]}>History</Text>
            )}
          </>
        }
        ListEmptyComponent={
          <View style={s.emptyState}>
            <Text style={{ fontSize: 32 }}>💰</Text>
            <Text style={[s.emptyText, { color: colors.muted }]}>No contributions yet</Text>
          </View>
        }
        renderItem={({ item: contrib }) => (
          <View style={[s.contribRow, { backgroundColor: colors.surface }]}>
            <View style={[s.contribIcon, { backgroundColor: colors.accent + "22" }]}>
              <Text style={{ fontSize: 18 }}>💰</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.contribNote, { color: colors.foreground }]}>
                {contrib.note || "Contribution"}
              </Text>
              <Text style={[s.contribDate, { color: colors.muted }]}>{formatDate(contrib.date)}</Text>
            </View>
            <Text style={[s.contribAmt, { color: colors.accent }]}>+{formatCurrency(contrib.amount)}</Text>
          </View>
        )}
      />

      {/* Add Contribution Modal */}
      <Modal visible={showContrib} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowContrib(false)}>
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: colors.background }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={[s.modalHeader, { paddingTop: insets.top + 16 }]}>
            <TouchableOpacity onPress={() => setShowContrib(false)}>
              <Text style={{ color: colors.muted, fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[s.modalTitle, { color: colors.foreground }]}>Add Contribution</Text>
            <TouchableOpacity onPress={handleAddContribution}>
              <Text style={{ color: colors.accent, fontSize: 16, fontWeight: "600" }}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={{ padding: 20 }}>
            <View style={s.amountRow}>
              <Text style={[s.currencySymbol, { color: colors.foreground }]}>$</Text>
              <TextInput
                style={[s.amountInput, { color: colors.foreground }]}
                value={contribAmount}
                onChangeText={setContribAmount}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={colors.muted}
                returnKeyType="done"
                autoFocus
              />
            </View>
            <View style={[s.noteInput, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <TextInput
                style={[{ color: colors.foreground, fontSize: 16, paddingVertical: 12 }]}
                value={contribNote}
                onChangeText={setContribNote}
                placeholder="Note (optional)"
                placeholderTextColor={colors.muted}
                returnKeyType="done"
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenContainer>
  );
}

const styles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    navBar: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
    backBtn: {},
    backTxt: { fontSize: 17, fontWeight: "500" },
    goalName: { fontSize: 26, fontWeight: "700", paddingHorizontal: 0, marginBottom: 24 },
    ringSection: { alignItems: "center", marginBottom: 24 },
    ringOuter: {
      width: 140,
      height: 140,
      borderRadius: 70,
      borderWidth: 10,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    ringProgress: {
      position: "absolute",
      width: 140,
      height: 140,
      borderRadius: 70,
      borderWidth: 10,
      borderLeftColor: "transparent",
      borderBottomColor: "transparent",
    },
    ringInner: {
      width: 108,
      height: 108,
      borderRadius: 54,
      alignItems: "center",
      justifyContent: "center",
    },
    ringPct: { fontSize: 28, fontWeight: "700" },
    ringLabel: { fontSize: 12, marginTop: 2 },
    completeBanner: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      borderRadius: 14,
      marginBottom: 16,
      gap: 10,
    },
    completeBannerIcon: { fontSize: 24 },
    completeBannerTxt: { flex: 1, fontSize: 14, fontWeight: "600", lineHeight: 20 },
    statsRow: {
      flexDirection: "row",
      borderRadius: 16,
      padding: 16,
      marginBottom: 20,
    },
    statItem: { flex: 1, alignItems: "center" },
    statLabel: { fontSize: 11, marginBottom: 4 },
    statValue: { fontSize: 15, fontWeight: "700" },
    statDivider: { width: 1, marginVertical: 4 },
    addBtn: {
      borderRadius: 14,
      padding: 16,
      alignItems: "center",
      marginBottom: 24,
    },
    addBtnTxt: { color: "#fff", fontSize: 16, fontWeight: "600" },
    historyTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
    contribRow: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      borderRadius: 14,
      marginBottom: 8,
      gap: 12,
    },
    contribIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    contribNote: { fontSize: 14, fontWeight: "600" },
    contribDate: { fontSize: 12, marginTop: 2 },
    contribAmt: { fontSize: 15, fontWeight: "700" },
    emptyState: { alignItems: "center", paddingVertical: 32, gap: 8 },
    emptyText: { fontSize: 15 },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingBottom: 16,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    modalTitle: { fontSize: 17, fontWeight: "600" },
    amountRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 24,
    },
    currencySymbol: { fontSize: 36, fontWeight: "300", marginRight: 4 },
    amountInput: { fontSize: 48, fontWeight: "300", minWidth: 120, textAlign: "center" },
    noteInput: {
      borderRadius: 12,
      borderWidth: 1,
      paddingHorizontal: 16,
    },
  });
