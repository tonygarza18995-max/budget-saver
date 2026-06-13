import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/use-colors";
import { useBudget } from "@/lib/budget-context";
import { useSubscription } from "@/lib/subscription-context";
import { Transaction, TransactionType } from "@/lib/storage";
import * as Haptics from "expo-haptics";

const EXPENSE_CATEGORIES = [
  { name: "Food", icon: "🍔" },
  { name: "Transport", icon: "🚗" },
  { name: "Housing", icon: "🏠" },
  { name: "Health", icon: "💊" },
  { name: "Shopping", icon: "🛍️" },
  { name: "Entertainment", icon: "🎮" },
  { name: "Education", icon: "📚" },
  { name: "Travel", icon: "✈️" },
  { name: "Utilities", icon: "⚡" },
  { name: "Clothing", icon: "👕" },
  { name: "Gifts", icon: "🎁" },
  { name: "Other", icon: "💸" },
];

const INCOME_CATEGORIES = [
  { name: "Salary", icon: "💼" },
  { name: "Freelance", icon: "💻" },
  { name: "Investment", icon: "📈" },
  { name: "Gift", icon: "🎁" },
  { name: "Refund", icon: "↩️" },
  { name: "Other", icon: "💰" },
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function AddTransactionModal({ visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addTransaction } = useBudget();
  const { state: subState } = useSubscription();

  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<{ name: string; icon: string } | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceInterval, setRecurrenceInterval] = useState<"weekly" | "monthly">("monthly");

  const categories = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const linkedCards = subState.linkedCards;

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount.");
      return;
    }
    if (!selectedCategory) {
      Alert.alert("Select Category", "Please select a category.");
      return;
    }

    const transaction: Transaction = {
      id: Date.now().toString(),
      type,
      amount: parseFloat(amount),
      category: selectedCategory.name,
      categoryIcon: selectedCategory.icon,
      title: title.trim() || selectedCategory.name,
      date: new Date().toISOString(),
      cardId: selectedCardId ?? undefined,
      isRecurring: isRecurring || undefined,
      recurrenceInterval: isRecurring ? recurrenceInterval : undefined,
    };

    await addTransaction(transaction);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    handleClose();
  };

  const handleClose = () => {
    setAmount("");
    setTitle("");
    setSelectedCategory(null);
    setSelectedCardId(null);
    setIsRecurring(false);
    setRecurrenceInterval("monthly");
    setType("expense");
    onClose();
  };

  const s = styles(colors);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[s.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={handleClose} style={s.closeBtn}>
            <Text style={[s.closeTxt, { color: colors.muted }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: colors.foreground }]}>Add Transaction</Text>
          <TouchableOpacity onPress={handleSave} style={s.saveBtn}>
            <Text style={[s.saveTxt, { color: colors.primary }]}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
          {/* Type Toggle */}
          <View style={s.toggleRow}>
            {(["expense", "income"] as TransactionType[]).map((t) => (
              <TouchableOpacity
                key={t}
                style={[
                  s.toggleBtn,
                  {
                    backgroundColor: type === t ? (t === "expense" ? colors.error : colors.success) : colors.surface,
                  },
                ]}
                onPress={() => {
                  setType(t);
                  setSelectedCategory(null);
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={[s.toggleTxt, { color: type === t ? "#fff" : colors.muted }]}>
                  {t === "expense" ? "Expense" : "Income"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Amount */}
          <View style={s.amountContainer}>
            <Text style={[s.currencySymbol, { color: colors.foreground }]}>$</Text>
            <TextInput
              style={[s.amountInput, { color: colors.foreground }]}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.muted}
              returnKeyType="done"
            />
          </View>

          {/* Title */}
          <View style={[s.inputRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <TextInput
              style={[s.textInput, { color: colors.foreground }]}
              value={title}
              onChangeText={setTitle}
              placeholder="Title (optional)"
              placeholderTextColor={colors.muted}
              returnKeyType="done"
            />
          </View>

          {/* Card Selector (if cards are linked) */}
          {linkedCards.length > 0 && (
            <>
              <Text style={[s.sectionLabel, { color: colors.muted }]}>Card / Account</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 10, paddingBottom: 4 }}
                style={{ marginBottom: 16 }}
              >
                {/* "No card" option */}
                <TouchableOpacity
                  style={[
                    s.cardChip,
                    {
                      backgroundColor: selectedCardId === null ? colors.primary + "22" : colors.surface,
                      borderColor: selectedCardId === null ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedCardId(null)}
                >
                  <Text style={{ fontSize: 16 }}>💵</Text>
                  <Text style={[s.cardChipTxt, { color: selectedCardId === null ? colors.primary : colors.muted }]}>
                    Cash
                  </Text>
                </TouchableOpacity>

                {linkedCards.map((card) => (
                  <TouchableOpacity
                    key={card.id}
                    style={[
                      s.cardChip,
                      {
                        backgroundColor: selectedCardId === card.id ? card.color + "33" : colors.surface,
                        borderColor: selectedCardId === card.id ? card.color : colors.border,
                      },
                    ]}
                    onPress={() => setSelectedCardId(card.id)}
                  >
                    <View style={[s.cardChipDot, { backgroundColor: card.color }]} />
                    <Text style={[s.cardChipTxt, { color: selectedCardId === card.id ? colors.foreground : colors.muted }]}>
                      {card.name} ••{card.last4}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          {/* Recurring Toggle */}
          <View style={[s.recurringRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[s.recurringTitle, { color: colors.foreground }]}>Recurring</Text>
              <Text style={[s.recurringSubtitle, { color: colors.muted }]}>Repeat this transaction automatically</Text>
            </View>
            <TouchableOpacity
              style={[s.toggle, { backgroundColor: isRecurring ? colors.primary : colors.border }]}
              onPress={() => setIsRecurring((v) => !v)}
            >
              <View style={[s.toggleThumb, { transform: [{ translateX: isRecurring ? 20 : 2 }] }]} />
            </TouchableOpacity>
          </View>
          {isRecurring && (
            <View style={s.intervalRow}>
              {(["weekly", "monthly"] as const).map((interval) => (
                <TouchableOpacity
                  key={interval}
                  style={[
                    s.intervalBtn,
                    {
                      backgroundColor: recurrenceInterval === interval ? colors.primary + "22" : colors.surface,
                      borderColor: recurrenceInterval === interval ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setRecurrenceInterval(interval)}
                >
                  <Text style={[s.intervalTxt, { color: recurrenceInterval === interval ? colors.primary : colors.muted }]}>
                    {interval === "weekly" ? "Every week" : "Every month"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Category */}
          <Text style={[s.sectionLabel, { color: colors.muted }]}>Category</Text>
          <View style={s.categoryGrid}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.name}
                style={[
                  s.categoryItem,
                  {
                    backgroundColor:
                      selectedCategory?.name === cat.name ? colors.primary + "22" : colors.surface,
                    borderColor:
                      selectedCategory?.name === cat.name ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => {
                  setSelectedCategory(cat);
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={s.categoryIcon}>{cat.icon}</Text>
                <Text style={[s.categoryName, { color: colors.foreground }]}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingBottom: 16,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    headerTitle: { fontSize: 17, fontWeight: "600" },
    closeBtn: { minWidth: 60 },
    closeTxt: { fontSize: 16 },
    saveBtn: { minWidth: 60, alignItems: "flex-end" },
    saveTxt: { fontSize: 16, fontWeight: "600" },
    toggleRow: { flexDirection: "row", margin: 20, gap: 12 },
    toggleBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center" },
    toggleTxt: { fontSize: 15, fontWeight: "600" },
    amountContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 16,
      paddingHorizontal: 20,
    },
    currencySymbol: { fontSize: 36, fontWeight: "300", marginRight: 4 },
    amountInput: { fontSize: 48, fontWeight: "300", minWidth: 120, textAlign: "center" },
    inputRow: {
      marginHorizontal: 20,
      marginBottom: 16,
      borderRadius: 12,
      borderWidth: 1,
      paddingHorizontal: 16,
      paddingVertical: 4,
    },
    textInput: { fontSize: 16, paddingVertical: 12 },
    sectionLabel: {
      fontSize: 13,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginHorizontal: 20,
      marginBottom: 12,
    },
    cardChip: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 20,
      borderWidth: 1.5,
      gap: 6,
    },
    cardChipDot: { width: 10, height: 10, borderRadius: 5 },
    cardChipTxt: { fontSize: 13, fontWeight: "500" },
    categoryGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, gap: 10 },
    categoryItem: {
      width: "30%",
      alignItems: "center",
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1.5,
      gap: 4,
    },
    categoryIcon: { fontSize: 24 },
    categoryName: { fontSize: 11, fontWeight: "500", textAlign: "center" },
    recurringRow: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 20,
      marginBottom: 12,
      borderRadius: 14,
      borderWidth: 1,
      padding: 14,
      gap: 12,
    },
    recurringTitle: { fontSize: 15, fontWeight: "600" },
    recurringSubtitle: { fontSize: 12, marginTop: 2 },
    toggle: {
      width: 44,
      height: 26,
      borderRadius: 13,
      justifyContent: "center",
    },
    toggleThumb: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: "#fff",
    },
    intervalRow: {
      flexDirection: "row",
      marginHorizontal: 20,
      marginBottom: 16,
      gap: 10,
    },
    intervalBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1.5,
      alignItems: "center",
    },
    intervalTxt: { fontSize: 13, fontWeight: "600" },
  });
