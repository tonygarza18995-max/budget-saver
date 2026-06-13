import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/use-colors";
import { useSubscription } from "@/lib/subscription-context";
import { LinkedCard, CardType } from "@/lib/storage";
import * as Haptics from "expo-haptics";

interface Props {
  visible: boolean;
  onClose: () => void;
}

const CARD_TYPES: { value: CardType; label: string; icon: string }[] = [
  { value: "checking", label: "Checking", icon: "🏦" },
  { value: "savings", label: "Savings", icon: "💰" },
  { value: "credit", label: "Credit", icon: "💳" },
  { value: "cash", label: "Cash", icon: "💵" },
];

const CARD_COLORS = [
  "#1a1a2e", "#16213e", "#0f3460", "#533483",
  "#2d6a4f", "#1b4332", "#6b2737", "#c77dff",
  "#e76f51", "#264653", "#2a9d8f", "#e9c46a",
];

export function AddCardModal({ visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addCard } = useSubscription();

  const [name, setName] = useState("");
  const [last4, setLast4] = useState("");
  const [balance, setBalance] = useState("");
  const [cardType, setCardType] = useState<CardType>("checking");
  const [cardColor, setCardColor] = useState(CARD_COLORS[0]);

  const reset = () => {
    setName("");
    setLast4("");
    setBalance("");
    setCardType("checking");
    setCardColor(CARD_COLORS[0]);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Missing Info", "Please enter a card name.");
      return;
    }
    if (last4.length !== 4 || !/^\d{4}$/.test(last4)) {
      Alert.alert("Invalid", "Please enter the last 4 digits of your card.");
      return;
    }
    const card: LinkedCard = {
      id: Date.now().toString(),
      name: name.trim(),
      type: cardType,
      last4,
      balance: parseFloat(balance) || 0,
      color: cardColor,
      createdAt: new Date().toISOString(),
    };
    await addCard(card);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    reset();
    onClose();
  };

  const s = styles(colors);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={[s.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={() => { reset(); onClose(); }}>
            <Text style={[s.headerBtn, { color: colors.muted }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: colors.foreground }]}>Add Card</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={[s.headerBtn, { color: colors.primary, fontWeight: "600" }]}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }} showsVerticalScrollIndicator={false}>
          {/* Card Preview */}
          <View style={[s.cardPreview, { backgroundColor: cardColor }]}>
            <View style={s.cardTopRow}>
              <Text style={s.cardNetwork}>
                {cardType === "credit" ? "CREDIT" : cardType === "checking" ? "DEBIT" : cardType.toUpperCase()}
              </Text>
              <Text style={s.cardChip}>◉</Text>
            </View>
            <Text style={s.cardNumber}>•••• •••• •••• {last4 || "0000"}</Text>
            <View style={s.cardBottomRow}>
              <Text style={s.cardName}>{name || "Card Name"}</Text>
              <Text style={s.cardBalance}>
                ${parseFloat(balance || "0").toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
          </View>

          {/* Card Name */}
          <View>
            <Text style={[s.label, { color: colors.muted }]}>Card Name</Text>
            <View style={[s.inputBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TextInput
                style={[s.input, { color: colors.foreground }]}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Chase Sapphire"
                placeholderTextColor={colors.muted}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Last 4 Digits */}
          <View>
            <Text style={[s.label, { color: colors.muted }]}>Last 4 Digits</Text>
            <View style={[s.inputBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TextInput
                style={[s.input, { color: colors.foreground }]}
                value={last4}
                onChangeText={(t) => setLast4(t.replace(/\D/g, "").slice(0, 4))}
                placeholder="1234"
                placeholderTextColor={colors.muted}
                keyboardType="number-pad"
                maxLength={4}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Balance */}
          <View>
            <Text style={[s.label, { color: colors.muted }]}>Current Balance</Text>
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
              />
            </View>
          </View>

          {/* Card Type */}
          <View>
            <Text style={[s.label, { color: colors.muted }]}>Account Type</Text>
            <View style={s.typeRow}>
              {CARD_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  style={[
                    s.typeBtn,
                    {
                      backgroundColor: cardType === t.value ? colors.primary + "22" : colors.surface,
                      borderColor: cardType === t.value ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setCardType(t.value)}
                >
                  <Text style={{ fontSize: 20 }}>{t.icon}</Text>
                  <Text style={[s.typeTxt, { color: cardType === t.value ? colors.primary : colors.muted }]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Card Color */}
          <View>
            <Text style={[s.label, { color: colors.muted }]}>Card Color</Text>
            <View style={s.colorRow}>
              {CARD_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    s.colorDot,
                    { backgroundColor: c },
                    cardColor === c && s.colorDotSelected,
                  ]}
                  onPress={() => setCardColor(c)}
                >
                  {cardColor === c && <Text style={{ color: "#fff", fontSize: 12 }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
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
    headerBtn: { fontSize: 16 },
    cardPreview: {
      borderRadius: 20,
      padding: 24,
      height: 180,
      justifyContent: "space-between",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 10,
    },
    cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    cardNetwork: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: "600", letterSpacing: 2 },
    cardChip: { color: "rgba(255,255,255,0.8)", fontSize: 22 },
    cardNumber: { color: "#fff", fontSize: 18, fontWeight: "300", letterSpacing: 4, textAlign: "center" },
    cardBottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
    cardName: { color: "rgba(255,255,255,0.9)", fontSize: 14, fontWeight: "600", textTransform: "uppercase" },
    cardBalance: { color: "#fff", fontSize: 18, fontWeight: "700" },
    label: { fontSize: 13, fontWeight: "500", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
    inputBox: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 12,
      borderWidth: 1,
      paddingHorizontal: 16,
    },
    currencyPrefix: { fontSize: 16, marginRight: 4 },
    input: { flex: 1, fontSize: 16, paddingVertical: 14 },
    typeRow: { flexDirection: "row", gap: 8 },
    typeBtn: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1.5,
      gap: 4,
    },
    typeTxt: { fontSize: 11, fontWeight: "600" },
    colorRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    colorDot: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    colorDotSelected: {
      borderWidth: 3,
      borderColor: "#fff",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
    },
  });
