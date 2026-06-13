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
import { SavingsGoal } from "@/lib/storage";
import * as Haptics from "expo-haptics";

const GOAL_PRESETS = [
  { name: "Emergency Fund", icon: "🛡️" },
  { name: "Vacation", icon: "✈️" },
  { name: "New Car", icon: "🚗" },
  { name: "Home Down Payment", icon: "🏠" },
  { name: "New Phone", icon: "📱" },
  { name: "Wedding", icon: "💍" },
  { name: "Education", icon: "📚" },
  { name: "Retirement", icon: "🌴" },
  { name: "Investment", icon: "📈" },
  { name: "Other", icon: "🎯" },
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function AddSavingsModal({ visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addSavingsGoal } = useBudget();

  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [savedAmount, setSavedAmount] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<{ name: string; icon: string } | null>(null);

  const handleSave = async () => {
    const goalName = name.trim() || selectedPreset?.name;
    if (!goalName) {
      Alert.alert("Missing Name", "Please enter a goal name.");
      return;
    }
    if (!targetAmount || parseFloat(targetAmount) <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid target amount.");
      return;
    }

    const goal: SavingsGoal = {
      id: Date.now().toString(),
      name: goalName,
      targetAmount: parseFloat(targetAmount),
      savedAmount: parseFloat(savedAmount) || 0,
      createdAt: new Date().toISOString(),
      contributions: [],
    };

    await addSavingsGoal(goal);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    handleClose();
  };

  const handleClose = () => {
    setName("");
    setTargetAmount("");
    setSavedAmount("");
    setSelectedPreset(null);
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
          <Text style={[s.headerTitle, { color: colors.foreground }]}>New Savings Goal</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={{ color: colors.accent, fontSize: 16, fontWeight: "600" }}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 32 }}>
          <Text style={[s.label, { color: colors.muted }]}>Goal Name</Text>
          <View style={[s.inputRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <TextInput
              style={[s.textInput, { color: colors.foreground }]}
              value={name}
              onChangeText={setName}
              placeholder={selectedPreset?.name ?? "e.g. Emergency Fund"}
              placeholderTextColor={colors.muted}
              returnKeyType="done"
            />
          </View>

          <Text style={[s.label, { color: colors.muted }]}>Target Amount ($)</Text>
          <View style={[s.inputRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <TextInput
              style={[s.textInput, { color: colors.foreground }]}
              value={targetAmount}
              onChangeText={setTargetAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.muted}
              returnKeyType="done"
            />
          </View>

          <Text style={[s.label, { color: colors.muted }]}>Already Saved ($)</Text>
          <View style={[s.inputRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <TextInput
              style={[s.textInput, { color: colors.foreground }]}
              value={savedAmount}
              onChangeText={setSavedAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.muted}
              returnKeyType="done"
            />
          </View>

          <Text style={[s.label, { color: colors.muted }]}>Quick Pick</Text>
          <View style={s.grid}>
            {GOAL_PRESETS.map((opt) => (
              <TouchableOpacity
                key={opt.name}
                style={[
                  s.gridItem,
                  {
                    backgroundColor:
                      selectedPreset?.name === opt.name ? colors.accent + "22" : colors.surface,
                    borderColor:
                      selectedPreset?.name === opt.name ? colors.accent : colors.border,
                  },
                ]}
                onPress={() => {
                  setSelectedPreset(opt);
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
