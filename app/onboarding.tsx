import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/use-colors";
import { setOnboardingDone } from "@/lib/storage";
import * as Haptics from "expo-haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const SLIDES = [
  {
    emoji: "💰",
    title: "Take Control of Your Money",
    subtitle:
      "Budget Saver helps you track every dollar, set spending limits, and always know where your money goes.",
    bg: "#10b981",
  },
  {
    emoji: "🎯",
    title: "Reach Your Savings Goals",
    subtitle:
      "Set a goal — vacation, emergency fund, new car — and watch your progress grow with every contribution.",
    bg: "#3b82f6",
  },
  {
    emoji: "📊",
    title: "Insights That Actually Help",
    subtitle:
      "See beautiful charts of your spending, get bill reminders, and export your data anytime. Your finances, simplified.",
    bg: "#8b5cf6",
  },
];

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentIndex < SLIDES.length - 1) {
      const next = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
      setCurrentIndex(next);
    } else {
      await handleFinish();
    }
  };

  const handleFinish = async () => {
    await setOnboardingDone();
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace("/(tabs)");
  };

  const handleSkip = async () => {
    await handleFinish();
  };

  const s = styles(colors);

  return (
    <View style={[s.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setCurrentIndex(idx);
        }}
        renderItem={({ item }) => (
          <View style={[s.slide, { backgroundColor: item.bg }]}>
            <View style={s.slideContent}>
              <Text style={s.emoji}>{item.emoji}</Text>
              <Text style={s.slideTitle}>{item.title}</Text>
              <Text style={s.slideSubtitle}>{item.subtitle}</Text>
            </View>
          </View>
        )}
      />

      {/* Bottom controls */}
      <View style={[s.controls, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        {/* Dots */}
        <View style={s.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                s.dot,
                {
                  backgroundColor: i === currentIndex ? "#fff" : "rgba(255,255,255,0.35)",
                  width: i === currentIndex ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        {/* Buttons */}
        <View style={s.btnRow}>
          <TouchableOpacity onPress={handleSkip} style={s.skipBtn}>
            <Text style={s.skipTxt}>Skip</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleNext} style={s.nextBtn}>
            <Text style={s.nextTxt}>
              {currentIndex === SLIDES.length - 1 ? "Get Started" : "Next →"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: SLIDES[0].bg },
    slide: {
      width: SCREEN_WIDTH,
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    slideContent: {
      paddingHorizontal: 40,
      alignItems: "center",
      gap: 20,
    },
    emoji: { fontSize: 80 },
    slideTitle: {
      fontSize: 30,
      fontWeight: "800",
      color: "#fff",
      textAlign: "center",
      lineHeight: 38,
    },
    slideSubtitle: {
      fontSize: 16,
      color: "rgba(255,255,255,0.85)",
      textAlign: "center",
      lineHeight: 24,
    },
    controls: {
      backgroundColor: "transparent",
      paddingHorizontal: 28,
      paddingTop: 20,
      gap: 20,
    },
    dots: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 6,
    },
    dot: {
      height: 8,
      borderRadius: 4,
    },
    btnRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    skipBtn: { padding: 12 },
    skipTxt: { color: "rgba(255,255,255,0.7)", fontSize: 16 },
    nextBtn: {
      backgroundColor: "#fff",
      paddingHorizontal: 28,
      paddingVertical: 14,
      borderRadius: 30,
    },
    nextTxt: { color: "#1a1a2e", fontSize: 16, fontWeight: "700" },
  });
