import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useColors } from "@/hooks/use-colors";

const TIPS = [
  { icon: "💡", text: "Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings." },
  { icon: "🎯", text: "Set a specific savings goal — you're 42% more likely to achieve it." },
  { icon: "☕", text: "Small daily expenses add up. $5/day = $1,825/year." },
  { icon: "📊", text: "Review your spending weekly to catch habits before they grow." },
  { icon: "🏦", text: "Pay yourself first — move savings before spending on wants." },
  { icon: "🛒", text: "Wait 24 hours before any purchase over $50. Impulse fades." },
  { icon: "📱", text: "Log every transaction right when it happens — don't wait!" },
  { icon: "💪", text: "Even saving $1 a day builds the habit. Start small." },
  { icon: "🔔", text: "Set up bill reminders so you never pay late fees again." },
  { icon: "📈", text: "Check your financial health score weekly to track progress." },
  { icon: "🎉", text: "Celebrate small wins — every goal milestone matters." },
  { icon: "🧾", text: "Categorize transactions to see exactly where money goes." },
  { icon: "💳", text: "Track all your cards in one place for a full picture." },
  { icon: "🚫", text: "Unsubscribe from services you haven't used in 30 days." },
  { icon: "🏷️", text: "Use budget categories to set spending limits that work for you." },
  { icon: "📅", text: "Plan your meals for the week — it can save $50-100/month." },
  { icon: "🎁", text: "Start a holiday fund early — save a little each month." },
  { icon: "⚡", text: "Automate your savings so you don't have to think about it." },
  { icon: "🌱", text: "Your streak is growing! Consistency is the key to financial health." },
  { icon: "💰", text: "An emergency fund of 3-6 months expenses gives peace of mind." },
  { icon: "🔄", text: "Review subscriptions monthly — cancel what you don't use." },
  { icon: "🏠", text: "Housing should ideally be under 30% of your income." },
  { icon: "📉", text: "Pay off highest-interest debt first to save the most money." },
  { icon: "🤝", text: "Share your goals with someone — accountability helps!" },
  { icon: "✨", text: "You opened the app today. That's already a win!" },
  { icon: "🧠", text: "Financial literacy is a skill. You're building it right now." },
  { icon: "🎯", text: "Break big goals into monthly targets — they feel more achievable." },
  { icon: "💵", text: "Round up purchases mentally — it builds awareness of spending." },
  { icon: "📝", text: "Write down your top 3 financial priorities this month." },
  { icon: "🌟", text: "You're doing better than you think. Keep going!" },
];

export function TipOfTheDay() {
  const colors = useColors();

  // Pick a tip based on the day of the year so it changes daily
  const tip = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    return TIPS[dayOfYear % TIPS.length];
  }, []);

  return (
    <View style={[s.container, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
      <View style={s.header}>
        <Text style={s.icon}>{tip.icon}</Text>
        <Text style={[s.title, { color: colors.primary }]}>Tip of the Day</Text>
      </View>
      <Text style={[s.text, { color: colors.foreground }]}>{tip.text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  icon: {
    fontSize: 20,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "500",
  },
});
