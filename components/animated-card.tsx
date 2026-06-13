import React from "react";
import { ViewStyle } from "react-native";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";

interface AnimatedCardProps {
  children: React.ReactNode;
  index?: number;
  direction?: "down" | "right";
  style?: ViewStyle | ViewStyle[];
  delay?: number;
}

export function AnimatedCard({
  children,
  index = 0,
  direction = "down",
  style,
  delay,
}: AnimatedCardProps) {
  const baseDelay = delay ?? index * 60;
  const entering =
    direction === "right"
      ? FadeInRight.delay(baseDelay).duration(400).springify().damping(18)
      : FadeInDown.delay(baseDelay).duration(400).springify().damping(18);

  return (
    <Animated.View entering={entering} style={style}>
      {children}
    </Animated.View>
  );
}
