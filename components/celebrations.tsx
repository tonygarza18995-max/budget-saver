import React, { useEffect, useMemo } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
  runOnJS,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// ─── Confetti ────────────────────────────────────────────────────────────────

const CONFETTI_COLORS = ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8"];
const CONFETTI_COUNT = 40;

interface ConfettiPieceProps {
  index: number;
  onFinish?: () => void;
  isLast: boolean;
}

function ConfettiPiece({ index, onFinish, isLast }: ConfettiPieceProps) {
  const translateY = useSharedValue(-20);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0);

  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const startX = Math.random() * SCREEN_WIDTH;
  const size = 6 + Math.random() * 6;
  const isCircle = Math.random() > 0.5;
  const delay = Math.random() * 400;

  useEffect(() => {
    scale.value = withDelay(delay, withTiming(1, { duration: 200 }));
    translateY.value = withDelay(
      delay,
      withTiming(SCREEN_HEIGHT * 0.7 + Math.random() * 200, {
        duration: 2000 + Math.random() * 1000,
        easing: Easing.out(Easing.quad),
      })
    );
    translateX.value = withDelay(
      delay,
      withTiming((Math.random() - 0.5) * 200, {
        duration: 2000 + Math.random() * 1000,
      })
    );
    rotate.value = withDelay(
      delay,
      withRepeat(withTiming(360, { duration: 1000 + Math.random() * 1000 }), 3, false)
    );
    opacity.value = withDelay(
      1800 + delay,
      withTiming(0, { duration: 600 }, (finished) => {
        if (finished && isLast && onFinish) {
          runOnJS(onFinish)();
        }
      })
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    position: "absolute" as const,
    left: startX,
    top: 0,
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        style,
        {
          width: size,
          height: isCircle ? size : size * 2.5,
          backgroundColor: color,
          borderRadius: isCircle ? size / 2 : 2,
        },
      ]}
    />
  );
}

interface ConfettiProps {
  visible: boolean;
  onFinish?: () => void;
}

export function Confetti({ visible, onFinish }: ConfettiProps) {
  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: CONFETTI_COUNT }).map((_, i) => (
        <ConfettiPiece
          key={i}
          index={i}
          isLast={i === CONFETTI_COUNT - 1}
          onFinish={onFinish}
        />
      ))}
    </View>
  );
}

// ─── Count-Up Number ─────────────────────────────────────────────────────────

interface CountUpProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  style?: any;
  decimals?: number;
}

export function CountUpNumber({ value, prefix = "", suffix = "", duration = 1200, style, decimals = 2 }: CountUpProps) {
  const animatedValue = useSharedValue(0);
  const [displayValue, setDisplayValue] = React.useState("0");

  useEffect(() => {
    animatedValue.value = 0;
    const startTime = Date.now();
    const endTime = startTime + duration;

    const update = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = value * eased;
      setDisplayValue(current.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }));
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };
    requestAnimationFrame(update);
  }, [value, duration]);

  return (
    <Text style={style}>
      {prefix}{displayValue}{suffix}
    </Text>
  );
}

// ─── Streak Badge ────────────────────────────────────────────────────────────

interface StreakBadgeProps {
  streak: number;
  colors: { foreground: string; primary: string; muted: string; surface: string; border: string };
}

export function StreakBadge({ streak, colors }: StreakBadgeProps) {
  const scale = useSharedValue(0.8);

  useEffect(() => {
    scale.value = withSequence(
      withTiming(1.15, { duration: 300, easing: Easing.out(Easing.back(2)) }),
      withTiming(1, { duration: 200 })
    );
  }, [streak]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (streak <= 0) return null;

  return (
    <Animated.View style={[streakStyles.container, { backgroundColor: colors.surface, borderColor: colors.border }, animStyle]}>
      <Text style={streakStyles.flame}>🔥</Text>
      <View>
        <Text style={[streakStyles.count, { color: colors.foreground }]}>{streak} day streak</Text>
        <Text style={[streakStyles.subtitle, { color: colors.muted }]}>Keep tracking!</Text>
      </View>
    </Animated.View>
  );
}

const streakStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  flame: { fontSize: 24 },
  count: { fontSize: 15, fontWeight: "700" },
  subtitle: { fontSize: 11, marginTop: 1 },
});

// ─── Success Checkmark ───────────────────────────────────────────────────────

interface SuccessCheckProps {
  visible: boolean;
  message?: string;
}

export function SuccessCheck({ visible, message = "Done!" }: SuccessCheckProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSequence(
        withTiming(1.2, { duration: 300, easing: Easing.out(Easing.back(2)) }),
        withTiming(1, { duration: 200 })
      );
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[checkStyles.overlay, animStyle]}>
      <View style={checkStyles.circle}>
        <Text style={checkStyles.check}>✓</Text>
      </View>
      <Text style={checkStyles.message}>{message}</Text>
    </Animated.View>
  );
}

const checkStyles = StyleSheet.create({
  overlay: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  circle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
  },
  check: { color: "#fff", fontSize: 32, fontWeight: "700" },
  message: { color: "#22C55E", fontSize: 16, fontWeight: "700" },
});
