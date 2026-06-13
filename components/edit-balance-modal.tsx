import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/use-colors";
import { useSubscription } from "@/lib/subscription-context";
import { LinkedCard } from "@/lib/storage";
import * as Haptics from "expo-haptics";

interface Props {
  visible: boolean;
  card: LinkedCard | null;
  onClose: () => void;
}

export function EditBalanceModal({ visible, card, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { updateCard } = useSubscription();
  const [balance, setBalance] = useState("");

  useEffect(() => {
    if (card && visible) {
      setBalance(card.balance.toFixed(2));
    }
  }, [card, visible]);

  const handleSave = async () => {
    if (!card) return;
    const newBalance = parseFloat(balance);
    if (isNaN(newBalance) || newBalance < 0) {
      Alert.alert("Invalid Amount", "Please enter a valid balance.");
      return;
    }
    await updateCard({ ...card, balance: newBalance });
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  const s = styles(colors);

  if (!card) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={[s.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={onClose}>
            <Text style={[s.headerBtn, { color: colors.muted }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: colors.foreground }]}>Update Balance</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={[s.headerBtn, { color: colors.primary, fontWeight: "600" }]}>Save</Text>
          </TouchableOpacity>
        </View>

        <View style={s.content}>
          {/* Card Preview */}
          <View style={[s.cardPreview, { backgroundColor: card.color }]}>
            <Text style={s.cardName}>{card.name}</Text>
            <Text style={s.cardLast4}>•••• {card.last4}</Text>
            <Text style={s.cardCurrentLabel}>Current Balance</Text>
            <Text style={s.cardCurrentBalance}>
              ${card.balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>

          {/* New Balance Input */}
          <View style={s.inputSection}>
            <Text style={[s.label, { color: colors.muted }]}>NEW BALANCE</Text>
            <View style={[s.inputBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[s.currencyPrefix, { color: colors.muted }]}>$</Text>
              <TextInput
                style={[s.input, { color: colors.foreground }]}
                value={balance}
                onChangeText={setBalance}
                placeholder="0.00"
                placeholderTextColor={colors.muted}
                keyboardType="decimal-pad"
                returnKeyType="done"
                autoFocus
                selectTextOnFocus
                onSubmitEditing={handleSave}
              />
            </View>
            <Text style={[s.hint, { color: colors.muted }]}>
              Enter your current account balance
            </Text>
          </View>
        </View>
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
    headerBtn: { fontSize: 16 },
    content: {
      padding: 20,
      gap: 24,
    },
    cardPreview: {
      borderRadius: 16,
      padding: 20,
      gap: 4,
    },
    cardName: { color: "rgba(255,255,255,0.9)", fontSize: 16, fontWeight: "600" },
    cardLast4: { color: "rgba(255,255,255,0.6)", fontSize: 12, letterSpacing: 2, marginBottom: 12 },
    cardCurrentLabel: { color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 8 },
    cardCurrentBalance: { color: "#fff", fontSize: 28, fontWeight: "700" },
    inputSection: {
      gap: 8,
    },
    label: { fontSize: 13, fontWeight: "500", letterSpacing: 0.5 },
    inputBox: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 12,
      borderWidth: 1,
      paddingHorizontal: 16,
    },
    currencyPrefix: { fontSize: 20, marginRight: 4, fontWeight: "600" },
    input: { flex: 1, fontSize: 24, fontWeight: "600", paddingVertical: 16 },
    hint: { fontSize: 12, marginTop: 4 },
  });
