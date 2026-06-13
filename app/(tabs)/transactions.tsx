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
import { AddTransactionModal } from "@/components/add-transaction-modal";
import { Transaction } from "@/lib/storage";
import * as Haptics from "expo-haptics";

type Filter = "all" | "income" | "expense";

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDateGroup(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function groupByDate(transactions: Transaction[]): { date: string; items: Transaction[] }[] {
  const map = new Map<string, Transaction[]>();
  for (const tx of transactions) {
    const key = new Date(tx.date).toDateString();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(tx);
  }
  return Array.from(map.entries()).map(([, items]) => ({
    date: items[0].date,
    items,
  }));
}

export default function TransactionsScreen() {
  const colors = useColors();
  const { state, deleteTransaction } = useBudget();
  const [filter, setFilter] = useState<Filter>("all");
  const [showAddTx, setShowAddTx] = useState(false);

  const filtered = useMemo(() => {
    if (filter === "all") return state.transactions;
    return state.transactions.filter((t) => t.type === filter);
  }, [state.transactions, filter]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  const handleDelete = (id: string) => {
    Alert.alert("Delete Transaction", "Are you sure you want to delete this transaction?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteTransaction(id);
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  const s = styles(colors);

  type ListItem =
    | { kind: "header"; date: string; key: string }
    | { kind: "tx"; tx: Transaction; key: string };

  const flatData: ListItem[] = grouped.flatMap((group) => [
    { kind: "header" as const, date: group.date, key: `h-${group.date}` },
    ...group.items.map((tx) => ({ kind: "tx" as const, tx, key: tx.id })),
  ]);

  return (
    <ScreenContainer>
      <View style={s.pageHeader}>
        <Text style={[s.pageTitle, { color: colors.foreground }]}>Transactions</Text>
      </View>

      {/* Filter */}
      <View style={s.filterRow}>
        {(["all", "income", "expense"] as Filter[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              s.filterBtn,
              {
                backgroundColor: filter === f ? colors.primary : colors.surface,
                borderColor: filter === f ? colors.primary : colors.border,
              },
            ]}
            onPress={() => {
              setFilter(f);
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Text style={[s.filterTxt, { color: filter === f ? "#fff" : colors.muted }]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {flatData.length === 0 ? (
        <View style={s.emptyState}>
          <Text style={{ fontSize: 48 }}>💳</Text>
          <Text style={[s.emptyText, { color: colors.muted }]}>No transactions yet</Text>
          <Text style={[s.emptySubtext, { color: colors.muted }]}>Tap + to add your first one</Text>
        </View>
      ) : (
        <FlatList
          data={flatData}
          keyExtractor={(item) => item.key}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          renderItem={({ item }) => {
            if (item.kind === "header") {
              return (
                <Text style={[s.dateHeader, { color: colors.muted }]}>
                  {formatDateGroup(item.date)}
                </Text>
              );
            }
            const { tx } = item;
            return (
              <TouchableOpacity
                style={[s.txRow, { backgroundColor: colors.surface }]}
                onLongPress={() => handleDelete(tx.id)}
                delayLongPress={400}
              >
                <View
                  style={[
                    s.txIcon,
                    {
                      backgroundColor:
                        tx.type === "income" ? colors.success + "22" : colors.error + "22",
                    },
                  ]}
                >
                  <Text style={{ fontSize: 20 }}>{tx.categoryIcon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.txTitle, { color: colors.foreground }]}>{tx.title}</Text>
                  <Text style={[s.txCategory, { color: colors.muted }]}>{tx.category}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text
                    style={[
                      s.txAmount,
                      { color: tx.type === "income" ? colors.success : colors.error },
                    ]}
                  >
                    {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                  </Text>
                  <Text style={[s.txTime, { color: colors.muted }]}>
                    {new Date(tx.date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                  </Text>
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
          setShowAddTx(true);
        }}
      >
        <Text style={s.fabIcon}>+</Text>
      </TouchableOpacity>

      <AddTransactionModal visible={showAddTx} onClose={() => setShowAddTx(false)} />
    </ScreenContainer>
  );
}

const styles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    pageHeader: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
    pageTitle: { fontSize: 28, fontWeight: "700" },
    filterRow: {
      flexDirection: "row",
      paddingHorizontal: 20,
      gap: 8,
      marginBottom: 16,
    },
    filterBtn: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
    },
    filterTxt: { fontSize: 14, fontWeight: "500" },
    dateHeader: {
      fontSize: 13,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginTop: 16,
      marginBottom: 8,
    },
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
    txCategory: { fontSize: 12, marginTop: 2 },
    txAmount: { fontSize: 15, fontWeight: "700" },
    txTime: { fontSize: 11, marginTop: 2 },
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
