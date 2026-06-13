import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/use-colors";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: "no_spend" | "daily_save" | "weekly_52" | "round_up" | "custom";
  durationDays: number;
  targetAmount?: number; // for saving challenges
  dailyTarget?: number;
  startDate: string; // ISO
  completedDays: string[]; // ISO date strings of completed days
  isActive: boolean;
}

const CHALLENGES_KEY = "budget_saver:challenges";

// ─── Preset Challenges ───────────────────────────────────────────────────────

const PRESET_CHALLENGES: Omit<Challenge, "id" | "startDate" | "completedDays" | "isActive">[] = [
  {
    title: "No-Spend Weekend",
    description: "Don't spend anything for 2 days. Essentials excluded.",
    icon: "🚫",
    type: "no_spend",
    durationDays: 2,
  },
  {
    title: "No-Spend Week",
    description: "Go 7 days without non-essential spending.",
    icon: "💪",
    type: "no_spend",
    durationDays: 7,
  },
  {
    title: "$5 a Day Challenge",
    description: "Save $5 every day for 30 days. That's $150!",
    icon: "🐷",
    type: "daily_save",
    durationDays: 30,
    targetAmount: 150,
    dailyTarget: 5,
  },
  {
    title: "52-Week Challenge",
    description: "Save $1 in week 1, $2 in week 2... $52 in week 52. Total: $1,378!",
    icon: "📈",
    type: "weekly_52",
    durationDays: 365,
    targetAmount: 1378,
  },
  {
    title: "$10 a Day Sprint",
    description: "Save $10 every day for 14 days. Quick $140 boost!",
    icon: "⚡",
    type: "daily_save",
    durationDays: 14,
    targetAmount: 140,
    dailyTarget: 10,
  },
  {
    title: "30-Day Budget Master",
    description: "Stay under budget in all categories for 30 days straight.",
    icon: "🏆",
    type: "no_spend",
    durationDays: 30,
  },
];

// ─── Storage ─────────────────────────────────────────────────────────────────

async function getChallenges(): Promise<Challenge[]> {
  try {
    const raw = await AsyncStorage.getItem(CHALLENGES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveChallenges(challenges: Challenge[]): Promise<void> {
  await AsyncStorage.setItem(CHALLENGES_KEY, JSON.stringify(challenges));
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useChallenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getChallenges().then((c) => {
      setChallenges(c);
      setLoaded(true);
    });
  }, []);

  const startChallenge = useCallback(async (presetIndex: number) => {
    const preset = PRESET_CHALLENGES[presetIndex];
    const challenge: Challenge = {
      ...preset,
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      startDate: new Date().toISOString(),
      completedDays: [],
      isActive: true,
    };
    const updated = [...challenges, challenge];
    setChallenges(updated);
    await saveChallenges(updated);
    return challenge;
  }, [challenges]);

  const checkInToday = useCallback(async (challengeId: string) => {
    const today = new Date().toISOString().slice(0, 10);
    const updated = challenges.map((c) => {
      if (c.id === challengeId && !c.completedDays.includes(today)) {
        return { ...c, completedDays: [...c.completedDays, today] };
      }
      return c;
    });
    setChallenges(updated);
    await saveChallenges(updated);
  }, [challenges]);

  const abandonChallenge = useCallback(async (challengeId: string) => {
    const updated = challenges.map((c) =>
      c.id === challengeId ? { ...c, isActive: false } : c
    );
    setChallenges(updated);
    await saveChallenges(updated);
  }, [challenges]);

  return { challenges, loaded, startChallenge, checkInToday, abandonChallenge, presets: PRESET_CHALLENGES };
}

// ─── Challenge Card ──────────────────────────────────────────────────────────

interface ChallengeCardProps {
  challenge: Challenge;
  onCheckIn: () => void;
  onAbandon: () => void;
  colors: ReturnType<typeof useColors>;
  index: number;
}

function ChallengeCard({ challenge, onCheckIn, onAbandon, colors, index }: ChallengeCardProps) {
  const today = new Date().toISOString().slice(0, 10);
  const checkedInToday = challenge.completedDays.includes(today);
  const daysCompleted = challenge.completedDays.length;
  const progress = Math.min(daysCompleted / challenge.durationDays, 1);
  const isComplete = daysCompleted >= challenge.durationDays;

  const startDate = new Date(challenge.startDate);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + challenge.durationDays);
  const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).duration(400)}
      style={[cs.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={cs.cardHeader}>
        <Text style={cs.cardIcon}>{challenge.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[cs.cardTitle, { color: colors.foreground }]}>{challenge.title}</Text>
          <Text style={[cs.cardDesc, { color: colors.muted }]}>
            {isComplete ? "Completed!" : `${daysLeft} days left`}
          </Text>
        </View>
        {isComplete && <Text style={cs.completeBadge}>✅</Text>}
      </View>

      {/* Progress bar */}
      <View style={[cs.progressBg, { backgroundColor: colors.border }]}>
        <View
          style={[
            cs.progressFill,
            {
              width: `${progress * 100}%`,
              backgroundColor: isComplete ? colors.success : colors.primary,
            },
          ]}
        />
      </View>
      <Text style={[cs.progressLabel, { color: colors.muted }]}>
        {daysCompleted} / {challenge.durationDays} days
        {challenge.targetAmount ? ` · $${(challenge.dailyTarget ?? 0) * daysCompleted} saved` : ""}
      </Text>

      {/* Actions */}
      {challenge.isActive && !isComplete && (
        <View style={cs.actions}>
          <TouchableOpacity
            style={[
              cs.checkInBtn,
              {
                backgroundColor: checkedInToday ? colors.border : colors.primary,
                opacity: checkedInToday ? 0.6 : 1,
              },
            ]}
            onPress={onCheckIn}
            disabled={checkedInToday}
          >
            <Text style={[cs.checkInTxt, { color: checkedInToday ? colors.muted : "#fff" }]}>
              {checkedInToday ? "✓ Checked In" : "Check In Today"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onAbandon}>
            <Text style={[cs.abandonTxt, { color: colors.error }]}>Abandon</Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
}

// ─── Challenges Section (for Dashboard) ──────────────────────────────────────

interface ChallengesSectionProps {
  compact?: boolean;
}

export function ChallengesSection({ compact = false }: ChallengesSectionProps) {
  const colors = useColors();
  const { challenges, loaded, startChallenge, checkInToday, abandonChallenge, presets } = useChallenges();
  const [showPresets, setShowPresets] = useState(false);

  const activeChallenges = challenges.filter((c) => c.isActive);

  const handleStart = async (idx: number) => {
    await startChallenge(idx);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowPresets(false);
  };

  const handleCheckIn = async (id: string) => {
    await checkInToday(id);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleAbandon = (id: string) => {
    Alert.alert("Abandon Challenge", "Are you sure? Your progress will be lost.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Abandon",
        style: "destructive",
        onPress: () => abandonChallenge(id),
      },
    ]);
  };

  if (!loaded) return null;

  return (
    <View style={sec.container}>
      <View style={sec.header}>
        <Text style={[sec.title, { color: colors.foreground }]}>Challenges</Text>
        <TouchableOpacity onPress={() => setShowPresets(!showPresets)}>
          <Text style={[sec.addBtn, { color: colors.primary }]}>
            {showPresets ? "Close" : "+ New"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Preset picker */}
      {showPresets && (
        <View style={sec.presetGrid}>
          {presets.map((p, i) => {
            const alreadyActive = activeChallenges.some((c) => c.title === p.title);
            return (
              <Animated.View key={p.title} entering={FadeInRight.delay(i * 60).duration(300)}>
                <TouchableOpacity
                  style={[
                    sec.presetCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: alreadyActive ? colors.success : colors.border,
                      opacity: alreadyActive ? 0.5 : 1,
                    },
                  ]}
                  onPress={() => !alreadyActive && handleStart(i)}
                  disabled={alreadyActive}
                >
                  <Text style={sec.presetIcon}>{p.icon}</Text>
                  <Text style={[sec.presetTitle, { color: colors.foreground }]} numberOfLines={1}>
                    {p.title}
                  </Text>
                  <Text style={[sec.presetDuration, { color: colors.muted }]}>
                    {p.durationDays} days
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      )}

      {/* Active challenges */}
      {activeChallenges.length === 0 && !showPresets ? (
        <TouchableOpacity
          style={[sec.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setShowPresets(true)}
        >
          <Text style={sec.emptyIcon}>🎯</Text>
          <Text style={[sec.emptyTitle, { color: colors.foreground }]}>Start a challenge</Text>
          <Text style={[sec.emptyDesc, { color: colors.muted }]}>
            Push yourself to save more with fun challenges
          </Text>
        </TouchableOpacity>
      ) : (
        activeChallenges.slice(0, compact ? 2 : 10).map((c, i) => (
          <ChallengeCard
            key={c.id}
            challenge={c}
            onCheckIn={() => handleCheckIn(c.id)}
            onAbandon={() => handleAbandon(c.id)}
            colors={colors}
            index={i}
          />
        ))
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const cs = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  cardIcon: { fontSize: 28 },
  cardTitle: { fontSize: 15, fontWeight: "700" },
  cardDesc: { fontSize: 12, marginTop: 2 },
  completeBadge: { fontSize: 22 },
  progressBg: { height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 6 },
  progressFill: { height: 8, borderRadius: 4 },
  progressLabel: { fontSize: 11, marginBottom: 10 },
  actions: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  checkInBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  checkInTxt: { fontSize: 14, fontWeight: "700" },
  abandonTxt: { fontSize: 13, fontWeight: "500" },
});

const sec = StyleSheet.create({
  container: { paddingHorizontal: 20, marginBottom: 24 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  title: { fontSize: 18, fontWeight: "700" },
  addBtn: { fontSize: 14, fontWeight: "600" },
  presetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  presetCard: {
    width: 105,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    gap: 4,
  },
  presetIcon: { fontSize: 24 },
  presetTitle: { fontSize: 11, fontWeight: "600", textAlign: "center" },
  presetDuration: { fontSize: 10 },
  emptyCard: {
    alignItems: "center",
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    gap: 6,
  },
  emptyIcon: { fontSize: 32 },
  emptyTitle: { fontSize: 15, fontWeight: "700" },
  emptyDesc: { fontSize: 12, textAlign: "center" },
});
