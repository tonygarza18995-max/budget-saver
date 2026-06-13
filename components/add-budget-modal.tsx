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
import { BudgetCategory } from "@/lib/storage";
import * as Haptics from "expo-haptics";

const CATEGORY_OPTIONS = [
  { name: "Food & Dining", icon: "🍔" },
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
  { name: "Subscriptions", icon: "📱" },
  { name: "Fitness", icon: "💪" },
  { name: "Personal Care", icon: "🧴" },
  { name: "Other", icon: "💸" },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  currentMonth: string; // "YYYY-MM"
}

export function AddBudgetModal({ visible, onClose, currentMonth }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addBudgetCategory } = useBudget();

  const [name, setName] = useState("");
  const [limit, setLimit] = useState("");
  const [selectedOption, setSelectedOption] = useState<{ name: string; icon: string } | null>(null);

  const handleSave = async () => {
    const categoryName = name.trim() || selectedOption?.name;
    if (!categoryName) {
      Alert.alert("Missing Name", "Please enter a category name or select one.");
      return;
    }
    if (!limit || parseFloat(limit) <= 0) {
      Alert.alert("Invalid Limit", "Please enter a valid budget limit.");
      return;
    }

    const category: BudgetCategory = {
      id: Date.now().toString(),
      name: categoryName,
      icon: selectedOption?.icon ?? "💸",
      limit: parseFloat(limit),
      month: currentMonth,
    };

    await addBudgetCategory(category);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    handleClose();
  };

  const handleClose = () => {
    setName("");
    setLimit("");
    setSelectedOption(null);
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
          <TouchableOpacity onPress={handleClose}>
            <Text style={{ color: colors.muted, fontSize: 16 }}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: colors.foreground }]}>New Budget</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={{ color: colors.primary, fontSize: 16, fontWeight: "600" }}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 32 }}>
          <Text style={[s.label, { color: colors.muted }]}>Category Name</Text>
          <View style={[s.inputRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <TextInput
              style={[s.textInput, { color: colors.foreground }]}
              value={name}
              onChangeText={setName}
              placeholder={selectedOption?.name ?? "e.g. Groceries"}
              placeholderTextColor={colors.muted}
              returnKeyType="done"
            />
          </View>

          <Text style={[s.label, { color: colors.muted }]}>Monthly Limit ($)</Text>
          <View style={[s.inputRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <TextInput
              style={[s.textInput, { color: colors.foreground }]}
              value={limit}
              onChangeText={setLimit}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.muted}
              returnKeyType="done"
            />
          </View>

          <Text style={[s.label, { color: colors.muted }]}>Quick Pick</Text>
          <View style={s.grid}>
            {CATEGORY_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.name}
                style={[
                  s.gridItem,
                  {
                    backgroundColor:
                      selectedOption?.name === opt.name ? colors.primary + "22" : colors.surface,
                    borderColor:
                      selectedOption?.name === opt.name ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => {
                  setSelectedOption(opt);
                  if (!name) setName(opt.name);
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={{ fontSize: 22 }}>{opt.icon}</Text>
                <Text style={{ fontSize: 10, color: colors.foreground, textAlign: "center", marginTop: 4 }}>
                  {opt.name}
                </Text>
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
    label: {
      fontSize: 13,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 8,
      marginTop: 16,
    },
    inputRow: {
      borderRadius: 12,
      borderWidth: 1,
      paddingHorizontal: 16,
      paddingVertical: 4,
    },
    textInput: {
      fontSize: 16,
      paddingVertical: 12,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginTop: 4,
    },
    gridItem: {
      width: "30%",
      alignItems: "center",
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1.5,
    },
  });
