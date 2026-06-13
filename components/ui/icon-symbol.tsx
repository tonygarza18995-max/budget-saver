// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * SF Symbols → Material Icons mapping for Budget Saver
 */
const MAPPING = {
  // Navigation tabs
  "house.fill": "home",
  "list.bullet": "list",
  "chart.pie.fill": "pie-chart",
  "banknote.fill": "savings",
  "person.fill": "person",
  "chart.bar.fill": "bar-chart",
  "person.crop.circle.fill": "account-circle",
  "star.fill": "star",
  "creditcard.circle.fill": "credit-card",
  // Actions
  "plus": "add",
  "plus.circle.fill": "add-circle",
  "trash.fill": "delete",
  "pencil": "edit",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "xmark": "close",
  "checkmark": "check",
  "checkmark.circle.fill": "check-circle",
  // Finance
  "dollarsign.circle.fill": "monetization-on",
  "arrow.up.circle.fill": "arrow-upward",
  "arrow.down.circle.fill": "arrow-downward",
  "creditcard.fill": "credit-card",
  "cart.fill": "shopping-cart",
  "fork.knife": "restaurant",
  "car.fill": "directions-car",
  "house.fill.badge.plus": "home",
  "heart.fill": "favorite",
  "bolt.fill": "bolt",
  "gamecontroller.fill": "sports-esports",
  "tshirt.fill": "checkroom",
  "medical.thermometer.fill": "local-hospital",
  "airplane": "flight",
  "graduationcap.fill": "school",
  "gift.fill": "card-giftcard",
  "ellipsis.circle.fill": "more-horiz",
  "target": "track-changes",
  "calendar": "calendar-today",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
} as unknown as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
