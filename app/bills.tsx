import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import {
  BillReminder,
  getBillReminders,
  addBillReminder,
  deleteBillReminder,
  toggleBillReminder,
} from "@/lib/storage";
import * as Haptics from "expo-haptics";

const BILL_ICONS = ["💡", "🏠", "📱", "🚗", "💧", "🌐", "📺", "🏥", "🎓", "💳", "🛡️", "📦"];

function formatCurrency(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getDaysUntilDue(dueDay: number): { label: string; urgent: boolean } {
  const today = new Date();
  const currentDay = today.getDate();
  const daysLeft = dueDay >= currentDay ? dueDay - currentDay : dueDay + (new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() - currentDay);
  if (daysLeft === 0) return { label: "Due today", urgent: true };
  if (daysLeft === 1) return { label: "Due tomorrow", urgent: true };
  if (daysLeft <= 5) return { label: `Due in ${daysLeft} days`, urgent: true };
  return { label: `Due on the ${dueDay}${dueDay === 1 ? "st" : dueDay === 2 ? "nd" : dueDay === 3 ? "rd" : "th"}`, urgent: false };
}

export default function BillsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [reminders, setReminders] = useState<BillReminder[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  // Add form state
  const [billTitle, setBillTitle] = useState("");
  const [billAmount, setBillAmount] = useState("");
  const [billDueDay, setBillDueDay] = useState("1");
  const [billIcon, setBillIcon] = useState("💡");

  const load = useCallback(async () => {
    const data = await getBillReminders();
    setReminders(data);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!billTitle.trim()) { Alert.alert("Enter a bill name"); return; }
    if (!billAmount || parseFloat(billAmount) <= 0) { Alert.alert("Enter a valid amount"); return; }
    const day = parseInt(billDueDay, 10);
    if (isNaN(day) || day < 1 || day > 31) { Alert.alert("Enter a valid due day (1-31)"); return; }

    const reminder: BillReminder = {
      id: Date.now().toString(),
      title: billTitle.trim(),
      amount: parseFloat(billAmount),
      dueDay: day,
      categoryIcon: billIcon,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    const updated = await addBillReminder(reminder);
    setReminders(updated);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setBillTitle(""); setBillAmount(""); setBillDueDay("1"); setBillIcon("💡");
    setShowAdd(false);
  };

  const handleToggle = async (id: string) => {
    const updated = await toggleBillReminder(id);
    setReminders(updated);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete Reminder", "Remove this bill reminder?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive", onPress: async () => {
          const updated = await deleteBillReminder(id);
          setReminders(updated);
        }
      },
    ]);
  };

  const totalMonthly = reminders.filter((r) => r.isActive).reduce((s, r) => s + r.amount, 0);
  const s = styles(colors);

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[s.header, { paddingTop: 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={[s.backTxt, { color: colors.primary }]}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={[s.pageTitle, { color: colors.foreground }]}>Bill Reminders</Text>
        <TouchableOpacity onPress={() => setShowAdd(true)} style={s.addBtn}>
          <Text style={[s.addTxt, { color: colors.primary }]}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Monthly total */}
      {reminders.length > 0 && (
        <View style={[s.totalCard, { backgroundColor: colors.primary }]}>
          <Text style={s.totalLabel}>Monthly Bills Total</Text>
          <Text style={s.totalValue}>{formatCurrency(totalMonthly)}</Text>
        </View>
      )}

      <FlatList
        data={reminders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={[s.emptyState, { backgroundColor: colors.surface }]}>
            <Text style={{ fontSize: 40 }}>🔔</Text>
            <Text style={[s.emptyText, { color: colors.foreground }]}>No bill reminders yet</Text>
            <Text style={[s.emptySubtext, { color: colors.muted }]}>Tap "+ Add" to set up a reminder for rent, utilities, subscriptions, and more.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const { label, urgent } = getDaysUntilDue(item.dueDay);
          return (
            <TouchableOpacity
              style={[s.billRow, { backgroundColor: colors.surface, opacity: item.isActive ? 1 : 0.5 }]}
              onLongPress={() => handleDelete(item.id)}
              activeOpacity={0.8}
            >
              <View style={[s.billIcon, { backgroundColor: urgent && item.isActive ? colors.error + "18" : colors.background }]}>
                <Text style={{ fontSize: 24 }}>{item.categoryIcon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.billTitle, { color: colors.foreground }]}>{item.title}</Text>
                <Text style={[s.billDue, { color: urgent && item.isActive ? colors.error : colors.muted }]}>{label}</Text>
              </View>
              <View style={s.billRight}>
                <Text style={[s.billAmount, { color: colors.foreground }]}>{formatCurrency(item.amount)}</Text>
                <TouchableOpacity
                  style={[s.toggle, { backgroundColor: item.isActive ? colors.primary : colors.border }]}
                  onPress={() => handleToggle(item.id)}
                >
                  <View style={[s.toggleThumb, { transform: [{ translateX: item.isActive ? 20 : 2 }] }]} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Add Bill Modal */}
      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAdd(false)}>
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={[s.modalHeader, { paddingTop: insets.top + 16 }]}>
            <TouchableOpacity onPress={() => setShowAdd(false)}>
              <Text style={[s.modalCancel, { color: colors.muted }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[s.modalTitle, { color: colors.foreground }]}>Add Bill Reminder</Text>
            <TouchableOpacity onPress={handleAdd}>
              <Text style={[s.modalSave, { color: colors.primary }]}>Save</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 60 }}>
            {/* Icon picker */}
            <Text style={[s.fieldLabel, { color: colors.muted }]}>Icon</Text>
            <View style={s.iconGrid}>
              {BILL_ICONS.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={[s.iconBtn, { backgroundColor: billIcon === icon ? colors.primary + "22" : colors.surface, borderColor: billIcon === icon ? colors.primary : colors.border }]}
                  onPress={() => setBillIcon(icon)}
                >
                  <Text style={{ fontSize: 22 }}>{icon}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[s.fieldLabel, { color: colors.muted }]}>Bill Name</Text>
            <TextInput
              style={[s.input, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]}
              value={billTitle}
              onChangeText={setBillTitle}
              placeholder="e.g. Rent, Netflix, Electric"
              placeholderTextColor={colors.muted}
              returnKeyType="next"
            />

            <Text style={[s.fieldLabel, { color: colors.muted }]}>Monthly Amount</Text>
            <View style={[s.amountRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[s.dollarSign, { color: colors.muted }]}>$</Text>
              <TextInput
                style={[s.amountInput, { color: colors.foreground }]}
                value={billAmount}
                onChangeText={setBillAmount}
                placeholder="0.00"
                placeholderTextColor={colors.muted}
                keyboardType="decimal-pad"
                returnKeyType="next"
              />
            </View>

            <Text style={[s.fieldLabel, { color: colors.muted }]}>Due Day of Month</Text>
            <TextInput
              style={[s.input, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]}
              value={billDueDay}
              onChangeText={setBillDueDay}
              placeholder="1–31"
              placeholderTextColor={colors.muted}
              keyboardType="number-pad"
              returnKeyType="done"
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenContainer>
  );
}

const styles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 8 },
    backBtn: { minWidth: 60 },
    backTxt: { fontSize: 17 },
    pageTitle: { fontSize: 17, fontWeight: "700" },
    addBtn: { minWidth: 60, alignItems: "flex-end" },
    addTxt: { fontSize: 16, fontWeight: "600" },
    totalCard: { marginHorizontal: 20, marginBottom: 16, borderRadius: 16, padding: 20, alignItems: "center" },
    totalLabel: { color: "rgba(255,255,255,0.8)", fontSize: 13 },
    totalValue: { color: "#fff", fontSize: 28, fontWeight: "700", marginTop: 4 },
    billRow: { flexDirection: "row", alignItems: "center", borderRadius: 16, padding: 14, marginBottom: 10, gap: 12 },
    billIcon: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
    billTitle: { fontSize: 15, fontWeight: "600" },
    billDue: { fontSize: 12, marginTop: 2 },
    billRight: { alignItems: "flex-end", gap: 8 },
    billAmount: { fontSize: 15, fontWeight: "700" },
    toggle: { width: 44, height: 26, borderRadius: 13, justifyContent: "center" },
    toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#fff" },
    emptyState: { borderRadius: 20, padding: 40, alignItems: "center", gap: 8 },
    emptyText: { fontSize: 16, fontWeight: "600" },
    emptySubtext: { fontSize: 13, textAlign: "center" },
    modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 0.5, borderBottomColor: colors.border },
    modalTitle: { fontSize: 17, fontWeight: "600" },
    modalCancel: { fontSize: 16 },
    modalSave: { fontSize: 16, fontWeight: "600" },
    fieldLabel: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
    input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
    amountRow: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, paddingHorizontal: 14 },
    dollarSign: { fontSize: 18, marginRight: 4 },
    amountInput: { flex: 1, fontSize: 18, paddingVertical: 12 },
    iconGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    iconBtn: { width: 52, height: 52, borderRadius: 14, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  });
