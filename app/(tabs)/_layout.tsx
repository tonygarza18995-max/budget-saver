import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useEffect } from "react";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Platform, View, Text } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { useSubscription } from "@/lib/subscription-context";
import { getOnboardingDone } from "@/lib/storage";

function ProfileTabIcon({ color, focused }: { color: string; focused: boolean }) {
  const { isPremium } = useSubscription();
  return (
    <View style={{ position: "relative" }}>
      <IconSymbol size={26} name="person.fill" color={color} />
      {isPremium && (
        <View
          style={{
            position: "absolute",
            top: -4,
            right: -6,
            backgroundColor: "#f59e0b",
            borderRadius: 6,
            width: 12,
            height: 12,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#fff", fontSize: 7, fontWeight: "700" }}>★</Text>
        </View>
      )}
    </View>
  );
}

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + bottomPadding;

  // On web, hide tab bar while landing page is showing
  const [hideTabBar, setHideTabBar] = useState(Platform.OS === "web");

  useEffect(() => {
    if (Platform.OS === "web") {
      getOnboardingDone().then((done) => {
        if (done) setHideTabBar(false);
      });
      // Listen for storage changes (when user clicks "Get Started" on landing page)
      const interval = setInterval(() => {
        getOnboardingDone().then((done) => {
          if (done) {
            setHideTabBar(false);
            clearInterval(interval);
          }
        });
      }, 500);
      return () => clearInterval(interval);
    }
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: hideTabBar
          ? { display: "none" }
          : {
              paddingTop: 8,
              paddingBottom: bottomPadding,
              height: tabBarHeight,
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              borderTopWidth: 0.5,
            },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: "Transactions",
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="list.bullet" color={color} />,
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          title: "Budget",
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="chart.pie.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="savings"
        options={{
          title: "Savings",
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="banknote.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: "Insights",
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="chart.bar.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => <ProfileTabIcon color={color} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
