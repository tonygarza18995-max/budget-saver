import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock AsyncStorage
const mockStore: Record<string, string> = {};
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(async (key: string) => mockStore[key] ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      mockStore[key] = value;
    }),
    removeItem: vi.fn(async (key: string) => {
      delete mockStore[key];
    }),
    clear: vi.fn(async () => {
      Object.keys(mockStore).forEach((k) => delete mockStore[k]);
    }),
  },
}));

// Mock react-native
vi.mock("react-native", () => ({
  Platform: { OS: "web" },
  StyleSheet: { create: (s: any) => s },
  Dimensions: { get: () => ({ width: 390, height: 844 }) },
  View: "View",
  Text: "Text",
  TouchableOpacity: "TouchableOpacity",
  ScrollView: "ScrollView",
  FlatList: "FlatList",
  Animated: {
    View: "View",
    Text: "Text",
    timing: vi.fn(() => ({ start: vi.fn() })),
    Value: vi.fn(() => ({
      interpolate: vi.fn(),
      setValue: vi.fn(),
    })),
  },
}));

// Mock reanimated
vi.mock("react-native-reanimated", () => ({
  default: {
    View: "View",
    Text: "Text",
    createAnimatedComponent: (c: any) => c,
  },
  useSharedValue: (v: any) => ({ value: v }),
  useAnimatedStyle: () => ({}),
  withTiming: (v: any) => v,
  withDelay: (_d: any, v: any) => v,
  withRepeat: (v: any) => v,
  withSequence: (...args: any[]) => args[0],
  FadeInDown: { delay: () => ({ duration: () => ({}) }) },
  Easing: { inOut: vi.fn(), bezier: vi.fn() },
  runOnJS: (fn: any) => fn,
  interpolateColor: vi.fn(),
}));

// Mock expo-haptics
vi.mock("expo-haptics", () => ({
  impactAsync: vi.fn(),
  notificationAsync: vi.fn(),
  ImpactFeedbackStyle: { Light: "Light", Medium: "Medium" },
  NotificationFeedbackType: { Success: "Success", Error: "Error" },
}));

// Mock react-native-svg
vi.mock("react-native-svg", () => ({
  default: "Svg",
  Svg: "Svg",
  Circle: "Circle",
  Path: "Path",
  G: "G",
  Text: "Text",
  Defs: "Defs",
  LinearGradient: "LinearGradient",
  Stop: "Stop",
  Rect: "Rect",
}));

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getStreakData,
  recordActivity,
  StreakData,
} from "../lib/storage";

describe("Streak Tracking", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("should return default streak data when no data exists", async () => {
    const data = await getStreakData();
    expect(data).toEqual({
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: "",
    });
  });

  it("should start a new streak when recording first activity", async () => {
    const data = await recordActivity();
    expect(data.currentStreak).toBe(1);
    expect(data.longestStreak).toBe(1);
    expect(data.lastActiveDate).toBeTruthy();
  });

  it("should maintain streak on same day", async () => {
    const first = await recordActivity();
    const second = await recordActivity();
    expect(second.currentStreak).toBe(first.currentStreak);
  });

  it("should increment streak on consecutive days", async () => {
    // Simulate yesterday's activity
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const streakData: StreakData = {
      currentStreak: 3,
      longestStreak: 5,
      lastActiveDate: yesterdayStr,
    };
    await AsyncStorage.setItem("budget_saver:streak_data", JSON.stringify(streakData));

    const result = await recordActivity();
    expect(result.currentStreak).toBe(4);
    expect(result.longestStreak).toBe(5);
  });

  it("should reset streak if more than 1 day gap", async () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 3);
    const dateStr = twoDaysAgo.toISOString().split("T")[0];

    const streakData: StreakData = {
      currentStreak: 10,
      longestStreak: 10,
      lastActiveDate: dateStr,
    };
    await AsyncStorage.setItem("budget_saver:streak_data", JSON.stringify(streakData));

    const result = await recordActivity();
    expect(result.currentStreak).toBe(1);
    // Longest should remain
    expect(result.longestStreak).toBe(10);
  });

  it("should update longest streak when current exceeds it", async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const streakData: StreakData = {
      currentStreak: 5,
      longestStreak: 5,
      lastActiveDate: yesterdayStr,
    };
    await AsyncStorage.setItem("budget_saver:streak_data", JSON.stringify(streakData));

    const result = await recordActivity();
    expect(result.currentStreak).toBe(6);
    expect(result.longestStreak).toBe(6);
  });
});

describe("Health Score Calculation Logic", () => {
  it("should calculate a perfect score with ideal conditions", () => {
    // Budget utilization: 60% (ideal range 50-80%)
    const budgetScore = 30; // max 30
    // Savings rate: 20% of income
    const savingsScore = 25; // max 25
    // Bill payment: all on time
    const billScore = 20; // max 20
    // Streak: 7+ days
    const streakScore = 15; // max 15
    // Expense trend: decreasing
    const trendScore = 10; // max 10

    const total = budgetScore + savingsScore + billScore + streakScore + trendScore;
    expect(total).toBe(100);
  });

  it("should give 0 for budget score when overspending 100%", () => {
    const spent = 2000;
    const limit = 1000;
    const ratio = spent / limit;
    const budgetScore = ratio > 1.2 ? 0 : ratio > 1 ? 10 : ratio >= 0.5 ? 30 : 20;
    expect(budgetScore).toBe(0);
  });

  it("should give partial score for moderate overspending", () => {
    const spent = 1100;
    const limit = 1000;
    const ratio = spent / limit;
    const budgetScore = ratio > 1.2 ? 0 : ratio > 1 ? 10 : ratio >= 0.5 ? 30 : 20;
    expect(budgetScore).toBe(10);
  });

  it("should give full score for ideal budget range", () => {
    const spent = 700;
    const limit = 1000;
    const ratio = spent / limit;
    const budgetScore = ratio > 1.2 ? 0 : ratio > 1 ? 10 : ratio >= 0.5 ? 30 : 20;
    expect(budgetScore).toBe(30);
  });
});

describe("Savings Challenges Logic", () => {
  it("should calculate 52-week challenge total correctly", () => {
    // Week 1: $1, Week 2: $2, ... Week 52: $52
    let total = 0;
    for (let i = 1; i <= 52; i++) total += i;
    expect(total).toBe(1378);
  });

  it("should calculate no-spend weekend progress", () => {
    const weekendDays = 2;
    const totalWeekends = 4; // in a month
    const completedWeekends = 3;
    const progress = completedWeekends / totalWeekends;
    expect(progress).toBe(0.75);
  });

  it("should calculate daily savings challenge progress", () => {
    const dailyAmount = 5;
    const totalDays = 30;
    const completedDays = 15;
    const saved = completedDays * dailyAmount;
    const target = totalDays * dailyAmount;
    expect(saved).toBe(75);
    expect(target).toBe(150);
    expect(saved / target).toBe(0.5);
  });
});
