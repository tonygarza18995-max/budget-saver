import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  FlatList,
  Appearance,
  Share,
  Linking,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useThemeContext } from "@/lib/theme-provider";
import { useSubscription } from "@/lib/subscription-context";
import { AddCardModal } from "@/components/add-card-modal";
import { SubscriptionModal } from "@/components/subscription-modal";
import { BugReportModal } from "@/components/bug-report-modal";
import { LinkedCard, getThemeOverride, saveThemeOverride, getTransactions, Transaction } from "@/lib/storage";
import * as Haptics from "expo-haptics";
import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const CARD_TYPE_ICONS: Record<string, string> = {
  checking: "🏦",
  savings: "💰",
  credit: "💳",
  cash: "💵",
};

export default function ProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const { setColorScheme: setAppColorScheme } = useThemeContext();
  const { state, isPremium, deleteCard } = useSubscription();
  const [showAddCard, setShowAddCard] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [showBugReport, setShowBugReport] = useState(false);
  const [themeOverride, setThemeOverride] = useState<"light" | "dark" | "system">("system");

  // Load persisted theme preference on mount and apply it
  useEffect(() => {
    getThemeOverride().then((saved) => {
      setThemeOverride(saved);
      if (saved !== "system") {
        setAppColorScheme(saved);
      }
    });
  }, []);

  const cycleTheme = async () => {
    const next = themeOverride === "system" ? "light" : themeOverride === "light" ? "dark" : "system";
    // Determine the actual scheme to apply (system falls back to device preference)
    const systemScheme = (Appearance.getColorScheme() ?? "light") as "light" | "dark";
    const schemeToApply = next === "system" ? systemScheme : next;
    await saveThemeOverride(next);
    setThemeOverride(next);
    setAppColorScheme(schemeToApply); // immediately update the live theme
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleExportCSV = useCallback(async () => {
    try {
      const transactions: Transaction[] = await getTransactions();
      if (transactions.length === 0) { Alert.alert("No Data", "Add some transactions first."); return; }
      const header = "Date,Type,Title,Category,Amount,Card\n";
      const rows = transactions.map((t) =>
        `${t.date.slice(0, 10)},${t.type},"${t.title}","${t.category}",${t.type === "expense" ? "-" : ""}${t.amount.toFixed(2)},${t.cardId ?? ""}`
      ).join("\n");
      const csv = header + rows;
      const path = `${FileSystem.cacheDirectory}budget_saver_export.csv`;
      await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 });

      if (Platform.OS === "android") {
        // Use content URI for Android to avoid file permission issues
        const contentUri = await FileSystem.getContentUriAsync(path);
        await Share.share({ title: "Budget Saver Transactions", message: `Budget Saver export (${transactions.length} transactions)`, url: contentUri });
      } else if (Platform.OS === "ios") {
        await Share.share({ url: path, title: "Budget Saver Transactions" });
      } else {
        // Web fallback: trigger download via blob
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "budget_saver_export.csv";
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      Alert.alert("Export Failed", String(e));
    }
  }, []);

  const { subscription, linkedCards } = state;

  const totalBalance = linkedCards.reduce((s, c) => s + c.balance, 0);

  const handleDeleteCard = (card: LinkedCard) => {
    Alert.alert("Remove Card", `Remove ${card.name} ••••${card.last4}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          await deleteCard(card.id);
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  const s = styles(colors);

  const tierColors: Record<string, string> = {
    free: colors.muted,
    basic: "#3b82f6",
    plus: "#8b5cf6",
    premium: "#f59e0b",
  };
  const tierColor = tierColors[subscription.tier] ?? colors.muted;

  type ListItem =
    | { kind: "header_sub"; key: string }
    | { kind: "sub_card"; key: string }
    | { kind: "header_cards"; key: string }
    | { kind: "card"; card: LinkedCard; key: string }
    | { kind: "add_card_btn"; key: string }
    | { kind: "header_settings"; key: string }
    | { kind: "setting_row"; icon: string; label: string; value?: string; onPress: () => void; key: string };

  const listData: ListItem[] = [
    { kind: "header_sub", key: "h_sub" },
    { kind: "sub_card", key: "sub_card" },
    { kind: "header_cards", key: "h_cards" },
    ...linkedCards.map((card) => ({ kind: "card" as const, card, key: card.id })),
    { kind: "add_card_btn", key: "add_card" },
    { kind: "header_settings", key: "h_settings" },
    {
      kind: "setting_row",
      key: "bills",
      icon: "🔔",
      label: "Bill Reminders",
      value: undefined,
      onPress: () => router.push("/bills"),
    },
    {
      kind: "setting_row",
      key: "export",
      icon: "📤",
      label: "Export to CSV",
      value: undefined,
      onPress: handleExportCSV,
    },
    {
      kind: "setting_row",
      key: "dark_mode",
      icon: themeOverride === "dark" ? "🌙" : themeOverride === "light" ? "☀️" : "⚙️",
      label: "Appearance",
      value: themeOverride === "system" ? "System" : themeOverride === "dark" ? "Dark" : "Light",
      onPress: cycleTheme,
    },
    {
      kind: "setting_row",
      key: "privacy",
      icon: "🔒",
      label: "Privacy",
      value: "Local only",
      onPress: () => Alert.alert("Privacy", "All your data is stored locally on your device. Nothing is sent to any server."),
    },
    {
      kind: "setting_row",
      key: "feedback",
      icon: "💬",
      label: "Send Feedback",
      value: undefined,
      onPress: () => {
        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const subject = encodeURIComponent("Budget Saver Feedback");
        const body = encodeURIComponent("Hi! Here's my feedback on Budget Saver:\n\n");
        const email = "antoniogarz1735@gmail.com";
        Linking.openURL(`mailto:${email}?subject=${subject}&body=${body}`);
      },
    },
    {
      kind: "setting_row",
      key: "bug_report",
      icon: "🐛",
      label: "Report a Bug",
      value: undefined,
      onPress: () => {
        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setShowBugReport(true);
      },
    },
    {
      kind: "setting_row",
      key: "about",
      icon: "ℹ️",
      label: "About Budget Saver",
      value: "v1.0.0",
      onPress: () => Alert.alert("Budget Saver", "Version 1.0.0\nBuilt to help you budget smarter and save more."),
    },
  ];

  return (
    <ScreenContainer>
      <View style={s.pageHeader}>
        <Text style={[s.pageTitle, { color: colors.foreground }]}>Profile</Text>
      </View>

      <FlatList
        data={listData}
        keyExtractor={(item) => item.key}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        renderItem={({ item }) => {
          if (item.kind === "header_sub") {
            return (
              <Text style={[s.sectionHeader, { color: colors.muted }]}>SUBSCRIPTION</Text>
            );
          }

          if (item.kind === "sub_card") {
            return (
              <TouchableOpacity
                style={[s.subCard, { backgroundColor: tierColor + "18", borderColor: tierColor + "44" }]}
                onPress={() => setShowSubscription(true)}
              >
                {/* Top row: icon + tier name */}
                <View style={s.subCardTop}>
                  <View style={[s.subIconBadge, { backgroundColor: tierColor }]}>
                    <Text style={s.subIconTxt}>{isPremium ? "★" : "FREE"}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.subTier, { color: tierColor }]}>
                      {subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)} Plan
                    </Text>
                    {isPremium ? (
                      <Text style={[s.subDetail, { color: colors.muted }]} numberOfLines={1}>
                        ${subscription.monthlyAmount}/mo · renews{" "}
                        {new Date(subscription.nextBillingDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </Text>
                    ) : (
                      <Text style={[s.subDetail, { color: colors.muted }]} numberOfLines={2}>
                        Upgrade to unlock all premium features
                      </Text>
                    )}
                  </View>
                </View>
                {/* Bottom row: action button */}
                <View style={[s.subBadge, { backgroundColor: tierColor }]}>
                  <Text style={s.subBadgeTxt}>{isPremium ? "Manage Plan" : "Upgrade Now"}</Text>
                </View>
              </TouchableOpacity>
            );
          }

          if (item.kind === "header_cards") {
            return (
              <View style={s.cardsSectionHeader}>
                <Text style={[s.sectionHeader, { color: colors.muted }]}>LINKED CARDS & ACCOUNTS</Text>
                {linkedCards.length > 0 && (
                  <Text style={[s.totalBalanceLabel, { color: colors.muted }]}>
                    Total: {formatCurrency(totalBalance)}
                  </Text>
                )}
              </View>
            );
          }

          if (item.kind === "card") {
            const { card } = item;
            return (
              <TouchableOpacity
                style={[s.cardRow, { backgroundColor: card.color }]}
                onLongPress={() => handleDeleteCard(card)}
                delayLongPress={400}
              >
                <View style={s.cardRowLeft}>
                  <Text style={s.cardRowIcon}>{CARD_TYPE_ICONS[card.type]}</Text>
                  <View>
                    <Text style={s.cardRowName}>{card.name}</Text>
                    <Text style={s.cardRowLast4}>••••  {card.last4}</Text>
                  </View>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={s.cardRowBalance}>{formatCurrency(card.balance)}</Text>
                  <Text style={s.cardRowType}>{card.type.toUpperCase()}</Text>
                </View>
              </TouchableOpacity>
            );
          }

          if (item.kind === "add_card_btn") {
            return (
              <TouchableOpacity
                style={[s.addCardBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setShowAddCard(true);
                }}
              >
                <Text style={[s.addCardIcon, { color: colors.primary }]}>+</Text>
                <Text style={[s.addCardTxt, { color: colors.primary }]}>Add Card or Account</Text>
              </TouchableOpacity>
            );
          }

          if (item.kind === "header_settings") {
            return (
              <Text style={[s.sectionHeader, { color: colors.muted, marginTop: 8 }]}>SETTINGS</Text>
            );
          }

          if (item.kind === "setting_row") {
            return (
              <TouchableOpacity
                style={[s.settingRow, { backgroundColor: colors.surface }]}
                onPress={item.onPress}
              >
                <Text style={s.settingIcon}>{item.icon}</Text>
                <Text style={[s.settingLabel, { color: colors.foreground }]}>{item.label}</Text>
                <View style={s.settingRight}>
                  {item.value && (
                    <Text style={[s.settingValue, { color: colors.muted }]}>{item.value}</Text>
                  )}
                  <Text style={[s.settingChevron, { color: colors.muted }]}>›</Text>
                </View>
              </TouchableOpacity>
            );
          }

          return null;
        }}
      />

      <AddCardModal visible={showAddCard} onClose={() => setShowAddCard(false)} />
      <SubscriptionModal visible={showSubscription} onClose={() => setShowSubscription(false)} />
      <BugReportModal visible={showBugReport} onClose={() => setShowBugReport(false)} />
    </ScreenContainer>
  );
}

const styles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    pageHeader: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
    pageTitle: { fontSize: 28, fontWeight: "700" },
    sectionHeader: {
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 0.8,
      marginTop: 16,
      marginBottom: 10,
    },
    cardsSectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 16,
      marginBottom: 10,
    },
    totalBalanceLabel: { fontSize: 12, fontWeight: "500" },
    // Subscription card
    subCard: {
      flexDirection: "column",
      borderRadius: 16,
      borderWidth: 1.5,
      padding: 16,
      marginBottom: 4,
      gap: 14,
    },
    subCardTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    subIconBadge: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    subIconTxt: { color: "#fff", fontSize: 13, fontWeight: "800" },
    subTier: { fontSize: 17, fontWeight: "700" },
    subDetail: { fontSize: 13, marginTop: 3, lineHeight: 18 },
    subBadge: {
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: "center",
    },
    subBadgeTxt: { color: "#fff", fontSize: 15, fontWeight: "700" },
    // Linked cards
    cardRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderRadius: 16,
      padding: 16,
      marginBottom: 10,
    },
    cardRowLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
    cardRowIcon: { fontSize: 24 },
    cardRowName: { color: "#fff", fontSize: 15, fontWeight: "600" },
    cardRowLast4: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2, letterSpacing: 2 },
    cardRowBalance: { color: "#fff", fontSize: 18, fontWeight: "700" },
    cardRowType: { color: "rgba(255,255,255,0.6)", fontSize: 10, letterSpacing: 1, marginTop: 2 },
    addCardBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 14,
      borderWidth: 1.5,
      borderStyle: "dashed",
      padding: 16,
      gap: 8,
      marginBottom: 4,
    },
    addCardIcon: { fontSize: 20, fontWeight: "300" },
    addCardTxt: { fontSize: 15, fontWeight: "600" },
    // Settings
    settingRow: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 14,
      padding: 16,
      marginBottom: 8,
      gap: 12,
    },
    settingIcon: { fontSize: 20, width: 28 },
    settingLabel: { flex: 1, fontSize: 15, fontWeight: "500" },
    settingRight: { flexDirection: "row", alignItems: "center", gap: 6 },
    settingValue: { fontSize: 14 },
    settingChevron: { fontSize: 20, fontWeight: "300" },
  });
