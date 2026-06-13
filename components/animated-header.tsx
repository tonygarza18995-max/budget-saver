import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolateColor,
} from "react-native-reanimated";
import { useColors } from "@/hooks/use-colors";

interface AnimatedHeaderProps {
  title: string;
  subtitle?: string;
  healthColor?: string; // dynamic color based on financial health
}

export function AnimatedHeader({ title, subtitle, healthColor }: AnimatedHeaderProps) {
  const colors = useColors();
  const shimmer = useSharedValue(0);
  const gradientPhase = useSharedValue(0);

  useEffect(() => {
    // Subtle gradient phase animation
    gradientPhase.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    // Shimmer effect
    shimmer.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const baseColor = healthColor || colors.primary;

  const bgStyle = useAnimatedStyle(() => {
    const bg = interpolateColor(
      gradientPhase.value,
      [0, 0.5, 1],
      [baseColor, baseColor + "DD", baseColor + "BB"]
    );
    return { backgroundColor: bg };
  });

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: shimmer.value * 0.08,
  }));

  return (
    <Animated.View style={[s.container, bgStyle]}>
      {/* Shimmer overlay */}
      <Animated.View style={[s.shimmerOverlay, overlayStyle]} />
      {/* Decorative circles */}
      <View style={[s.circle, s.circle1]} />
      <View style={[s.circle, s.circle2]} />
      <View style={[s.circle, s.circle3]} />
      {/* Content */}
      <View style={s.content}>
        {subtitle && <Text style={s.subtitle}>{subtitle}</Text>}
        <Text style={s.title}>{title}</Text>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    overflow: "hidden",
    position: "relative",
  },
  shimmerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#fff",
  },
  circle: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  circle1: { width: 200, height: 200, top: -80, right: -40 },
  circle2: { width: 120, height: 120, bottom: -40, left: -20 },
  circle3: { width: 80, height: 80, top: 10, right: 60 },
  content: { zIndex: 1 },
  subtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 4,
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
  },
});
