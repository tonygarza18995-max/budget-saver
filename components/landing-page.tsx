import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Linking,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Svg, { Circle, Path, Rect, Defs, LinearGradient, Stop } from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const isWide = SCREEN_WIDTH > 768;

/* ── Brand Colors ── */
const C = {
  primary: "#10B981",
  primaryDark: "#059669",
  primaryLight: "#D1FAE5",
  accent: "#6366F1",
  bg: "#0F1117",
  bgCard: "#1A1D23",
  bgCardHover: "#242830",
  white: "#FFFFFF",
  textPrimary: "#F9FAFB",
  textSecondary: "#9CA3AF",
  textMuted: "#6B7280",
  border: "#2D3748",
  income: "#10B981",
  expense: "#EF4444",
  warning: "#F59E0B",
  purple: "#8B5CF6",
  blue: "#3B82F6",
};

/* ── Animated Score Ring (static for web) ── */
function ScoreRing({ score = 82 }: { score?: number }) {
  const size = 160;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = score >= 70 ? C.primary : score >= 40 ? C.warning : C.expense;

  return (
    <View style={{ alignItems: "center" }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={C.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${progress} ${circumference - progress}`}
          strokeDashoffset={circumference / 4}
          strokeLinecap="round"
        />
      </Svg>
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 42, fontWeight: "900", color: C.white }}>{score}</Text>
        <Text style={{ fontSize: 12, color: C.textSecondary, fontWeight: "600" }}>EXCELLENT</Text>
      </View>
    </View>
  );
}

/* ── Mini Pie Chart ── */
function MiniPie() {
  const size = 120;
  const cx = size / 2;
  const cy = size / 2;
  const r = 45;
  const slices = [
    { pct: 0.35, color: C.primary },
    { pct: 0.25, color: C.accent },
    { pct: 0.20, color: C.warning },
    { pct: 0.12, color: C.blue },
    { pct: 0.08, color: C.purple },
  ];
  let cumulative = 0;
  const paths = slices.map((s, i) => {
    const startAngle = cumulative * 360;
    cumulative += s.pct;
    const endAngle = cumulative * 360;
    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    const largeArc = s.pct > 0.5 ? 1 : 0;
    return (
      <Path
        key={i}
        d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`}
        fill={s.color}
      />
    );
  });
  return <Svg width={size} height={size}>{paths}</Svg>;
}

/* ── Feature Card ── */
function FeatureCard({ emoji, title, desc }: { emoji: string; title: string; desc: string }) {
  return (
    <View style={s.featureCard}>
      <Text style={s.featureEmoji}>{emoji}</Text>
      <Text style={s.featureTitle}>{title}</Text>
      <Text style={s.featureDesc}>{desc}</Text>
    </View>
  );
}

/* ── Pricing Card ── */
function PricingCard({
  name,
  price,
  features,
  highlighted,
  color,
}: {
  name: string;
  price: string;
  features: string[];
  highlighted?: boolean;
  color: string;
}) {
  return (
    <View
      style={[
        s.pricingCard,
        highlighted && { borderColor: color, borderWidth: 2 },
      ]}
    >
      {highlighted && (
        <View style={[s.popularBadge, { backgroundColor: color }]}>
          <Text style={s.popularText}>MOST POPULAR</Text>
        </View>
      )}
      <Text style={[s.pricingName, { color }]}>{name}</Text>
      <View style={{ flexDirection: "row", alignItems: "flex-end", marginVertical: 12 }}>
        <Text style={s.pricingPrice}>{price}</Text>
        <Text style={s.pricingPeriod}>/month</Text>
      </View>
      {features.map((f, i) => (
        <View key={i} style={s.pricingFeatureRow}>
          <Text style={[s.pricingCheck, { color }]}>✓</Text>
          <Text style={s.pricingFeatureText}>{f}</Text>
        </View>
      ))}
    </View>
  );
}

/* ── Stat Card ── */
function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <View style={s.statCard}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

/* ── Testimonial Card ── */
function TestimonialCard({ quote, name, role }: { quote: string; name: string; role: string }) {
  return (
    <View style={s.testimonialCard}>
      <Text style={s.testimonialQuote}>"{quote}"</Text>
      <View style={{ marginTop: 16 }}>
        <Text style={s.testimonialName}>{name}</Text>
        <Text style={s.testimonialRole}>{role}</Text>
      </View>
    </View>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN LANDING PAGE
   ══════════════════════════════════════════════════════════════ */
/* ── Waitlist Modal ── */
function WaitlistModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }
    setStatus("loading");
    try {
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      const res = await fetch(`${baseUrl}/api/trpc/waitlist.join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json: { email: trimmed } }),
        credentials: "include",
      });
      const data = await res.json();
      if (data?.result?.data?.json?.success) {
        setStatus("success");
        setMessage(data.result.data.json.message);
      } else {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      }
    } catch (err) {
      setStatus("error");
      setMessage("Network error. Please check your connection and try again.");
    }
  };

  const handleClose = () => {
    setEmail("");
    setStatus("idle");
    setMessage("");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={wl.overlay}>
        <TouchableOpacity style={wl.backdrop} activeOpacity={1} onPress={handleClose} />
        <View style={wl.card}>
          {status === "success" ? (
            <View style={{ alignItems: "center", gap: 16 }}>
              <Text style={{ fontSize: 48 }}>\u2705</Text>
              <Text style={wl.title}>You're In!</Text>
              <Text style={wl.subtitle}>{message}</Text>
              <TouchableOpacity onPress={handleClose} style={wl.btn}>
                <Text style={wl.btnText}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={wl.title}>Get Early Access</Text>
              <Text style={wl.subtitle}>
                Join the waitlist and be the first to know when Budget Saver launches.
              </Text>
              <TextInput
                style={wl.input}
                placeholder="your@email.com"
                placeholderTextColor={C.textMuted}
                value={email}
                onChangeText={(t) => { setEmail(t); if (status === "error") setStatus("idle"); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                editable={status !== "loading"}
              />
              {status === "error" && message ? (
                <Text style={wl.errorText}>{message}</Text>
              ) : null}
              <TouchableOpacity
                onPress={handleSubmit}
                style={[wl.btn, status === "loading" && { opacity: 0.7 }]}
                disabled={status === "loading"}
              >
                {status === "loading" ? (
                  <ActivityIndicator color={C.white} size="small" />
                ) : (
                  <Text style={wl.btnText}>Join the Waitlist</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={handleClose} style={{ marginTop: 12 }}>
                <Text style={{ color: C.textMuted, fontSize: 14, textAlign: "center" }}>Maybe later</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ── Bug Report Modal (Web) ── */
const BUG_SCREEN_OPTIONS = [
  "Home / Dashboard",
  "Transactions",
  "Budget",
  "Savings",
  "Insights",
  "Profile / Settings",
  "Subscription",
  "Website",
  "Other",
];

function BugReportWebModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [description, setDescription] = useState("");
  const [selectedScreen, setSelectedScreen] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    if (description.trim().length < 5) {
      setStatus("error");
      setMessage("Please describe the bug in at least 5 characters.");
      return;
    }
    setStatus("loading");
    try {
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      const res = await fetch(`${baseUrl}/api/trpc/bugReport.submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          json: {
            description: description.trim(),
            screen: selectedScreen || undefined,
            platform: "web",
            email: email.trim() || undefined,
          },
        }),
        credentials: "include",
      });
      const data = await res.json();
      if (data?.result?.data?.json?.success) {
        setStatus("success");
        setMessage(data.result.data.json.message);
      } else {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      }
    } catch (err) {
      setStatus("error");
      setMessage("Network error. Please check your connection and try again.");
    }
  };

  const handleClose = () => {
    setDescription("");
    setSelectedScreen("");
    setEmail("");
    setStatus("idle");
    setMessage("");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={br.overlay}>
        <TouchableOpacity style={br.backdrop} activeOpacity={1} onPress={handleClose} />
        <View style={br.card}>
          {status === "success" ? (
            <View style={{ alignItems: "center", gap: 16 }}>
              <Text style={{ fontSize: 48 }}>\u2705</Text>
              <Text style={br.title}>Thank You!</Text>
              <Text style={br.subtitle}>{message}</Text>
              <TouchableOpacity onPress={handleClose} style={br.btn}>
                <Text style={br.btnText}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView style={{ maxHeight: 500 }} showsVerticalScrollIndicator={false}>
              <Text style={br.title}>Report a Bug</Text>
              <Text style={br.subtitle}>
                Found something that doesn't work right? Let us know and we'll fix it.
              </Text>

              <Text style={br.label}>What happened? <Text style={{ color: C.expense }}>*</Text></Text>
              <TextInput
                style={[br.textArea]}
                placeholder="Describe the bug you encountered..."
                placeholderTextColor={C.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={2000}
                value={description}
                onChangeText={(t) => { setDescription(t); if (status === "error") setStatus("idle"); }}
              />
              <Text style={br.charCount}>{description.length}/2000</Text>

              <Text style={[br.label, { marginTop: 12 }]}>Which screen?</Text>
              <View style={br.chipContainer}>
                {BUG_SCREEN_OPTIONS.map((screen) => (
                  <TouchableOpacity
                    key={screen}
                    style={[
                      br.chip,
                      selectedScreen === screen && { backgroundColor: C.primary + "33", borderColor: C.primary },
                    ]}
                    onPress={() => setSelectedScreen(selectedScreen === screen ? "" : screen)}
                  >
                    <Text style={[
                      br.chipText,
                      selectedScreen === screen && { color: C.primary },
                    ]}>{screen}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[br.label, { marginTop: 12 }]}>Your email (optional)</Text>
              <TextInput
                style={br.input}
                placeholder="you@example.com"
                placeholderTextColor={C.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              {status === "error" && message ? (
                <Text style={br.errorText}>{message}</Text>
              ) : null}

              <TouchableOpacity
                onPress={handleSubmit}
                style={[br.btn, (status === "loading" || description.trim().length < 5) && { opacity: 0.5 }]}
                disabled={status === "loading" || description.trim().length < 5}
              >
                {status === "loading" ? (
                  <ActivityIndicator color={C.white} size="small" />
                ) : (
                  <Text style={br.btnText}>Submit Bug Report</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={handleClose} style={{ marginTop: 12 }}>
                <Text style={{ color: C.textMuted, fontSize: 14, textAlign: "center" }}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const br = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "center", alignItems: "center" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.7)" },
  card: {
    backgroundColor: C.bgCard,
    borderRadius: 20,
    padding: 32,
    width: "90%",
    maxWidth: 500,
    borderWidth: 1,
    borderColor: C.border,
  },
  title: { color: C.white, fontSize: 24, fontWeight: "800", textAlign: "center", marginBottom: 8 },
  subtitle: { color: C.textSecondary, fontSize: 15, textAlign: "center", lineHeight: 22, marginBottom: 20 },
  label: { color: C.textSecondary, fontSize: 14, fontWeight: "600", marginBottom: 8 },
  textArea: {
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: C.white,
    minHeight: 100,
    lineHeight: 22,
  },
  charCount: { color: C.textMuted, fontSize: 12, textAlign: "right", marginTop: 4 },
  chipContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.bg,
  },
  chipText: { color: C.textSecondary, fontSize: 13, fontWeight: "500" },
  input: {
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: C.white,
    marginBottom: 8,
  },
  errorText: { color: C.expense, fontSize: 13, marginBottom: 8, marginTop: 4 },
  btn: {
    backgroundColor: C.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  btnText: { color: C.white, fontSize: 16, fontWeight: "700" },
});

const wl = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "center", alignItems: "center" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.7)" },
  card: {
    backgroundColor: C.bgCard,
    borderRadius: 20,
    padding: 32,
    width: "90%",
    maxWidth: 420,
    borderWidth: 1,
    borderColor: C.border,
  },
  title: { color: C.white, fontSize: 24, fontWeight: "800", textAlign: "center", marginBottom: 8 },
  subtitle: { color: C.textSecondary, fontSize: 15, textAlign: "center", lineHeight: 22, marginBottom: 20 },
  input: {
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: C.white,
    marginBottom: 8,
  },
  errorText: { color: C.expense, fontSize: 13, marginBottom: 8 },
  btn: {
    backgroundColor: C.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  btnText: { color: C.white, fontSize: 16, fontWeight: "700" },
});

/* ══════════════════════════════════════════════════════════════
   MAIN LANDING PAGE
   ══════════════════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════════════════
   PRIVACY POLICY PAGE
   ══════════════════════════════════════════════════════════════ */
function PrivacyPolicyPage({ onBack }: { onBack: () => void }) {
  return (
    <ScrollView style={pp.root} contentContainerStyle={pp.content}>
      {/* Nav */}
      <View style={s.nav}>
        <View style={s.navInner}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={s.navLogo}>
              <Text style={s.navLogoText}>$</Text>
            </View>
            <Text style={s.navBrand}>Budget Saver</Text>
          </View>
          <TouchableOpacity onPress={onBack} style={s.navCta}>
            <Text style={s.navCtaText}>← Back to Home</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={pp.body}>
        <Text style={pp.title}>Privacy Policy</Text>
        <Text style={pp.meta}>Effective Date: May 13, 2026 · Last Updated: May 13, 2026</Text>

        <Text style={pp.heading}>Introduction</Text>
        <Text style={pp.paragraph}>
          Welcome to Budget Saver. We are committed to protecting your privacy and being transparent about how your information is handled. This Privacy Policy explains what data Budget Saver collects, how it is used, and the choices you have regarding your information.
        </Text>
        <Text style={pp.paragraph}>
          Please read this policy carefully. By using Budget Saver, you agree to the practices described below.
        </Text>

        <Text style={pp.heading}>Who We Are</Text>
        <Text style={pp.paragraph}>
          Budget Saver is a personal finance application designed to help individuals track spending, manage budgets, and reach savings goals. The app is developed and maintained by the Budget Saver team ("we," "us," or "our").
        </Text>
        <Text style={pp.paragraph}>
          If you have any questions about this policy, you may contact us at: support@budgetsaverapp.com
        </Text>

        <Text style={pp.heading}>Information We Collect</Text>
        <Text style={pp.paragraph}>
          Budget Saver is designed with your privacy as a priority. The vast majority of your data never leaves your device. All financial data you enter — including transactions, budget categories, savings goals, and linked card details — is stored locally on your device only using secure on-device storage. This data is never transmitted to our servers or any third party.
        </Text>

        {/* Data table */}
        <View style={pp.table}>
          <View style={pp.tableHeader}>
            <Text style={[pp.tableCell, pp.tableHeaderText, { flex: 2 }]}>Data Type</Text>
            <Text style={[pp.tableCell, pp.tableHeaderText, { flex: 1 }]}>Storage</Text>
            <Text style={[pp.tableCell, pp.tableHeaderText, { flex: 1 }]}>Shared?</Text>
          </View>
          {[
            ["Transactions (income/expenses)", "On-device", "No"],
            ["Budget categories and limits", "On-device", "No"],
            ["Savings goals and contributions", "On-device", "No"],
            ["Linked card names & last 4 digits", "On-device", "No"],
            ["Card balances (manually entered)", "On-device", "No"],
            ["Subscription tier preference", "On-device", "No"],
          ].map(([type, storage, shared], i) => (
            <View key={i} style={[pp.tableRow, i % 2 === 0 && { backgroundColor: "rgba(255,255,255,0.02)" }]}>
              <Text style={[pp.tableCell, pp.tableCellText, { flex: 2 }]}>{type}</Text>
              <Text style={[pp.tableCell, pp.tableCellText, { flex: 1 }]}>{storage}</Text>
              <Text style={[pp.tableCell, pp.tableCellText, { flex: 1 }]}>{shared}</Text>
            </View>
          ))}
        </View>

        <Text style={pp.heading}>Information Collected Automatically</Text>
        <Text style={pp.paragraph}>
          Budget Saver does not automatically collect analytics, crash reports, advertising identifiers, or usage statistics. We do not use any third-party analytics SDKs (such as Firebase Analytics, Mixpanel, or similar services).
        </Text>

        <Text style={pp.heading}>How We Use Your Information</Text>
        <Text style={pp.paragraph}>
          Because all financial data is stored locally on your device, we do not have access to it and therefore do not use it in any way. The only information we may receive is what you voluntarily send us through direct communication (e.g., a support email), which we use exclusively to assist you.
        </Text>

        <Text style={pp.heading}>Data Storage and Security</Text>
        <Text style={pp.paragraph}>
          Your financial data is stored on your device using AsyncStorage, a secure local storage system. We strongly recommend that you keep your device updated, use a screen lock (PIN, password, Face ID, or fingerprint), and be cautious on shared devices.
        </Text>
        <Text style={pp.paragraph}>
          We do not have the ability to access, retrieve, or recover data stored on your device. If you uninstall the app, all locally stored data will be permanently deleted.
        </Text>

        <Text style={pp.heading}>Subscription and Payments</Text>
        <Text style={pp.paragraph}>
          Budget Saver offers optional premium subscriptions with fixed pricing tiers. On Android, subscriptions are processed through Google Play Billing. On the website, subscriptions are processed through Stripe with custom "pay what you want" amounts. Subscription preferences are stored locally on your device and synced with the respective payment processor. Payment processing is governed by Google Play's and Stripe's respective privacy policies.
        </Text>

        <Text style={pp.heading}>Children's Privacy</Text>
        <Text style={pp.paragraph}>
          Budget Saver is not directed at children under the age of 13. We do not knowingly collect any personal information from children under 13. If you believe a child under 13 has provided personal information through our app, please contact us immediately.
        </Text>

        <Text style={pp.heading}>Third-Party Services</Text>
        <Text style={pp.paragraph}>
          Budget Saver does not integrate with any third-party services, advertising networks, or data brokers. The app does not contain advertisements and does not share your data with any external parties.
        </Text>

        <Text style={pp.heading}>Your Rights and Choices</Text>
        <Text style={pp.paragraph}>
          Because your data is stored entirely on your device, you have full control over it at all times. You may access your data at any time by opening the app, delete your data by clearing the app's data or uninstalling, and export your data using any export features available within the app.
        </Text>
        <Text style={pp.paragraph}>
          Residents of certain jurisdictions (such as the EU under GDPR, or California under CCPA) may have additional rights. Since we do not collect or process your personal financial data on our servers, most of these rights are exercised directly through your device.
        </Text>

        <Text style={pp.heading}>Changes to This Privacy Policy</Text>
        <Text style={pp.paragraph}>
          We may update this Privacy Policy from time to time to reflect changes in the app or applicable law. When we make changes, we will update the "Last Updated" date at the top of this document.
        </Text>

        <Text style={pp.heading}>Contact Us</Text>
        <Text style={pp.paragraph}>
          If you have any questions, concerns, or requests regarding this Privacy Policy, please contact us:
        </Text>
        <Text style={[pp.paragraph, { color: C.primary, fontWeight: "600" }]}>support@budgetsaverapp.com</Text>

        <Text style={[pp.paragraph, { marginTop: 32, fontStyle: "italic", color: C.textMuted }]}>
          This Privacy Policy was prepared for Budget Saver and reflects the app's data practices as of the effective date above.
        </Text>

        {/* Back button at bottom */}
        <TouchableOpacity onPress={onBack} style={pp.backBtn}>
          <Text style={pp.backBtnText}>← Back to Home Page</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={s.footer}>
        <View style={s.footerDivider} />
        <Text style={{ color: C.textMuted, fontSize: 12, textAlign: "center", paddingVertical: 16 }}>
          © {new Date().getFullYear()} Budget Saver. All rights reserved.
        </Text>
      </View>
    </ScrollView>
  );
}

const pp = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { alignItems: "stretch" },
  body: {
    maxWidth: 800,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  title: {
    color: C.white,
    fontSize: isWide ? 42 : 32,
    fontWeight: "900",
    marginBottom: 8,
  },
  meta: {
    color: C.textMuted,
    fontSize: 14,
    marginBottom: 32,
  },
  heading: {
    color: C.white,
    fontSize: 22,
    fontWeight: "800",
    marginTop: 32,
    marginBottom: 12,
  },
  paragraph: {
    color: C.textSecondary,
    fontSize: 15,
    lineHeight: 26,
    marginBottom: 12,
  },
  table: {
    marginVertical: 16,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: C.bgCard,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  tableHeaderText: {
    color: C.white,
    fontWeight: "700",
    fontSize: 13,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(45,55,72,0.5)",
  },
  tableCell: {
    paddingHorizontal: 4,
  },
  tableCellText: {
    color: C.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  backBtn: {
    backgroundColor: C.primary,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 14,
    alignSelf: "center",
    marginTop: 40,
  },
  backBtnText: {
    color: C.white,
    fontSize: 16,
    fontWeight: "700",
  },
});

export function LandingPage({ onGetStarted }: { onGetStarted: () => void }) {
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showBugReport, setShowBugReport] = useState(false);
  const openWaitlist = () => setShowWaitlist(true);

  if (showPrivacy) {
    return <PrivacyPolicyPage onBack={() => setShowPrivacy(false)} />;
  }

  return (
    <ScrollView style={s.root} contentContainerStyle={s.rootContent}>
      <WaitlistModal visible={showWaitlist} onClose={() => setShowWaitlist(false)} />
      <BugReportWebModal visible={showBugReport} onClose={() => setShowBugReport(false)} />
      {/* ── NAV BAR ── */}
      <View style={s.nav}>
        <View style={s.navInner}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={s.navLogo}>
              <Text style={s.navLogoText}>$</Text>
            </View>
            <Text style={s.navBrand}>Budget Saver</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 20, alignItems: "center" }}>
            <TouchableOpacity onPress={onGetStarted}>
              <Text style={s.navLink}>Features</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onGetStarted}>
              <Text style={s.navLink}>Pricing</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={openWaitlist}
              style={s.navCta}
            >
              <Text style={s.navCtaText}>Get Started Free</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── HERO ── */}
      <View style={s.hero}>
        <View style={s.heroGlow} />
        <View style={s.heroContent}>
          <View style={s.heroBadge}>
            <Text style={s.heroBadgeText}>🚀 Now with AI-powered insights</Text>
          </View>
          <Text style={s.heroTitle}>
            Take Control of{"\n"}Your{" "}
            <Text style={{ color: C.primary }}>Finances</Text>
          </Text>
          <Text style={s.heroSubtitle}>
            Budget smarter, save faster, and build lasting financial habits.
            Track spending, set goals, and get personalized insights — all in one beautiful app.
          </Text>
          <View style={s.heroBtnRow}>
            <TouchableOpacity onPress={openWaitlist} style={s.heroPrimaryBtn}>
              <Text style={s.heroPrimaryBtnText}>Start Saving Today</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={openWaitlist} style={s.heroSecondaryBtn}>
              <Text style={s.heroSecondaryBtnText}>See How It Works</Text>
            </TouchableOpacity>
          </View>
          <Text style={s.heroNote}>Free to use · No credit card required</Text>
        </View>

        {/* Hero visual */}
        <View style={s.heroVisual}>
          <View style={s.phoneFrame}>
            <View style={s.phoneScreen}>
              <View style={s.phoneHeader}>
                <Text style={{ color: C.textSecondary, fontSize: 12 }}>Good morning</Text>
                <Text style={{ color: C.white, fontSize: 22, fontWeight: "800" }}>$4,280.50</Text>
                <Text style={{ color: C.primary, fontSize: 13, fontWeight: "600" }}>↑ 12% from last month</Text>
              </View>
              <View style={{ alignItems: "center", marginVertical: 16 }}>
                <ScoreRing score={82} />
                <Text style={{ color: C.textSecondary, fontSize: 11, marginTop: 8 }}>Financial Health Score</Text>
              </View>
              <View style={s.phoneMiniCards}>
                <View style={[s.phoneMiniCard, { backgroundColor: "rgba(16,185,129,0.15)" }]}>
                  <Text style={{ color: C.income, fontSize: 11 }}>Income</Text>
                  <Text style={{ color: C.income, fontSize: 16, fontWeight: "700" }}>$5,200</Text>
                </View>
                <View style={[s.phoneMiniCard, { backgroundColor: "rgba(239,68,68,0.15)" }]}>
                  <Text style={{ color: C.expense, fontSize: 11 }}>Spent</Text>
                  <Text style={{ color: C.expense, fontSize: 16, fontWeight: "700" }}>$3,120</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* ── STATS BAR ── */}
      <View style={s.statsBar}>
        <StatCard value="50K+" label="Active Users" />
        <StatCard value="$2.4M" label="Money Saved" />
        <StatCard value="4.8★" label="App Rating" />
        <StatCard value="150K+" label="Goals Reached" />
      </View>

      {/* ── FEATURES SECTION ── */}
      <View style={s.section}>
        <Text style={s.sectionLabel}>FEATURES</Text>
        <Text style={s.sectionTitle}>Everything You Need to{"\n"}Master Your Money</Text>
        <Text style={s.sectionSubtitle}>
          Powerful tools designed to make budgeting effortless and saving automatic.
        </Text>

        <View style={s.featuresGrid}>
          <FeatureCard
            emoji="📊"
            title="Smart Dashboard"
            desc="See your complete financial picture at a glance — balance, income, expenses, and savings all in one place."
          />
          <FeatureCard
            emoji="🎯"
            title="Savings Goals"
            desc="Set goals for vacations, emergency funds, or big purchases. Track progress with beautiful visual rings."
          />
          <FeatureCard
            emoji="💳"
            title="Card Management"
            desc="Link your debit, credit, and savings cards. Track spending per card and never lose sight of where money goes."
          />
          <FeatureCard
            emoji="📈"
            title="Spending Insights"
            desc="Interactive pie and bar charts break down your spending by category. Spot trends and cut waste instantly."
          />
          <FeatureCard
            emoji="🏆"
            title="Savings Challenges"
            desc="Gamify your savings with fun challenges like No-Spend Weekend, 52-Week Challenge, and Save $5/Day."
          />
          <FeatureCard
            emoji="🔔"
            title="Bill Reminders"
            desc="Never miss a payment. Set due dates for recurring bills and get notified before they're due."
          />
          <FeatureCard
            emoji="💡"
            title="Smart Tips"
            desc="Get personalized spending insights based on your actual patterns. AI-powered advice that actually helps."
          />
          <FeatureCard
            emoji="❤️"
            title="Financial Health Score"
            desc="A single 0-100 score that tells you exactly how well you're managing your money. Track improvement over time."
          />
          <FeatureCard
            emoji="📤"
            title="Export & Share"
            desc="Download your transaction history as CSV anytime. Perfect for tax season or sharing with a financial advisor."
          />
        </View>
      </View>

      {/* ── HOW IT WORKS ── */}
      <View style={[s.section, { backgroundColor: C.bgCard }]}>
        <Text style={s.sectionLabel}>HOW IT WORKS</Text>
        <Text style={s.sectionTitle}>Get Started in 3 Simple Steps</Text>
        <View style={s.stepsRow}>
          <View style={s.stepCard}>
            <View style={[s.stepNumber, { backgroundColor: C.primary }]}>
              <Text style={s.stepNumberText}>1</Text>
            </View>
            <Text style={s.stepTitle}>Set Your Budget</Text>
            <Text style={s.stepDesc}>
              Create monthly spending limits for each category — groceries, dining, entertainment, and more.
            </Text>
          </View>
          <View style={s.stepCard}>
            <View style={[s.stepNumber, { backgroundColor: C.accent }]}>
              <Text style={s.stepNumberText}>2</Text>
            </View>
            <Text style={s.stepTitle}>Track Everything</Text>
            <Text style={s.stepDesc}>
              Log income and expenses in seconds. Tag them to cards and categories for automatic organization.
            </Text>
          </View>
          <View style={s.stepCard}>
            <View style={[s.stepNumber, { backgroundColor: C.purple }]}>
              <Text style={s.stepNumberText}>3</Text>
            </View>
            <Text style={s.stepTitle}>Watch Your Savings Grow</Text>
            <Text style={s.stepDesc}>
              Set savings goals, take on challenges, and watch your financial health score climb higher every week.
            </Text>
          </View>
        </View>
      </View>

      {/* ── INSIGHTS PREVIEW ── */}
      <View style={s.section}>
        <Text style={s.sectionLabel}>INSIGHTS</Text>
        <Text style={s.sectionTitle}>Know Exactly Where{"\n"}Your Money Goes</Text>
        <View style={s.insightsRow}>
          <View style={s.insightsChart}>
            <MiniPie />
            <View style={{ marginTop: 16, gap: 8 }}>
              {[
                { label: "Groceries", pct: "35%", color: C.primary },
                { label: "Dining", pct: "25%", color: C.accent },
                { label: "Transport", pct: "20%", color: C.warning },
                { label: "Shopping", pct: "12%", color: C.blue },
                { label: "Other", pct: "8%", color: C.purple },
              ].map((item, i) => (
                <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: item.color }} />
                  <Text style={{ color: C.textSecondary, fontSize: 13, flex: 1 }}>{item.label}</Text>
                  <Text style={{ color: C.textPrimary, fontSize: 13, fontWeight: "600" }}>{item.pct}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={s.insightsInfo}>
            <Text style={{ color: C.primary, fontSize: 14, fontWeight: "700", marginBottom: 8 }}>
              THIS MONTH'S BREAKDOWN
            </Text>
            <Text style={{ color: C.textPrimary, fontSize: 22, fontWeight: "800", marginBottom: 12, lineHeight: 30 }}>
              Beautiful charts that make sense of your spending
            </Text>
            <Text style={{ color: C.textSecondary, fontSize: 15, lineHeight: 24 }}>
              Switch between pie and bar charts, navigate months, and see exactly how your spending compares.
              Our smart tips analyze your patterns and suggest ways to save more.
            </Text>
          </View>
        </View>
      </View>

      {/* ── PRICING ── */}
      <View style={[s.section, { backgroundColor: C.bgCard }]}>
        <Text style={s.sectionLabel}>PRICING</Text>
        <Text style={s.sectionTitle}>Flexible Pricing</Text>
        <Text style={s.sectionSubtitle}>
          Choose the plan that works for your budget. On the app (Android), fixed tiers. On the web, pay what you want.
        </Text>
        <View style={s.pricingRow}>
          <PricingCard
            name="Basic"
            price="$3"
            color={C.primary}
            features={[
              "Unlimited transactions",
              "Budget categories",
              "Savings goals",
              "Dark mode",
            ]}
          />
          <PricingCard
            name="Plus"
            price="$6"
            color={C.accent}
            highlighted
            features={[
              "Everything in Basic",
              "Spending insights & charts",
              "Bill reminders",
              "CSV export",
              "Savings challenges",
            ]}
          />
          <PricingCard
            name="Premium"
            price="$12"
            color={C.purple}
            features={[
              "Everything in Plus",
              "Financial health score",
              "Smart AI tips",
              "Unlimited cards",
              "Priority support",
            ]}
          />
        </View>
        <Text style={{ color: C.textMuted, textAlign: "center", marginTop: 16, fontSize: 14 }}>
          Or set your own price — we believe everyone deserves great financial tools.
        </Text>
      </View>

      {/* ── TESTIMONIALS ── */}
      <View style={s.section}>
        <Text style={s.sectionLabel}>TESTIMONIALS</Text>
        <Text style={s.sectionTitle}>Loved by Savers Everywhere</Text>
        <View style={s.testimonialsRow}>
          <TestimonialCard
            quote="I saved $800 in my first month just by seeing where my money was actually going. The insights are incredible."
            name="Sarah M."
            role="Freelance Designer"
          />
          <TestimonialCard
            quote="The savings challenges made budgeting fun for the first time. My emergency fund went from $0 to $2,000 in 3 months."
            name="James K."
            role="Software Engineer"
          />
          <TestimonialCard
            quote="Finally an app that doesn't overwhelm you. Clean, simple, and it actually works. The health score keeps me motivated."
            name="Maria L."
            role="Small Business Owner"
          />
        </View>
      </View>

      {/* ── CTA SECTION ── */}
      <View style={s.ctaSection}>
        <View style={s.ctaGlow} />
        <Text style={s.ctaTitle}>Ready to Take Control?</Text>
        <Text style={s.ctaSubtitle}>
          Join thousands of people who are saving more and stressing less about money.
        </Text>
        <TouchableOpacity onPress={openWaitlist} style={s.ctaBtn}>
          <Text style={s.ctaBtnText}>Get Started Free →</Text>
        </TouchableOpacity>
        <Text style={{ color: C.textMuted, marginTop: 12, fontSize: 13 }}>
          No credit card required · Free forever plan available
        </Text>
      </View>

      {/* ── FOOTER ── */}
      <View style={s.footer}>
        <View style={s.footerInner}>
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={s.navLogo}>
                <Text style={s.navLogoText}>$</Text>
              </View>
              <Text style={[s.navBrand, { fontSize: 18 }]}>Budget Saver</Text>
            </View>
            <Text style={{ color: C.textMuted, fontSize: 13 }}>
              Smart budgeting for everyone.
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 24 }}>
            <TouchableOpacity onPress={onGetStarted}>
              <Text style={s.footerLink}>Features</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onGetStarted}>
              <Text style={s.footerLink}>Pricing</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowPrivacy(true)}>
              <Text style={s.footerLink}>Privacy Policy</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowBugReport(true)}>
              <Text style={s.footerLink}>Report a Bug</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={s.footerDivider} />
        <Text style={{ color: C.textMuted, fontSize: 12, textAlign: "center", paddingVertical: 16 }}>
          © {new Date().getFullYear()} Budget Saver. All rights reserved.
        </Text>
      </View>
    </ScrollView>
  );
}

/* ══════════════════════════════════════════════════════════════
   STYLES
   ══════════════════════════════════════════════════════════════ */
const maxW = 1200;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  rootContent: { alignItems: "stretch" },

  /* Nav */
  nav: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: "rgba(15,17,23,0.9)",
  },
  navInner: {
    maxWidth: maxW,
    width: "100%",
    alignSelf: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
  },
  navLogo: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  navLogoText: { color: C.white, fontSize: 20, fontWeight: "900" },
  navBrand: { color: C.white, fontSize: 20, fontWeight: "800" },
  navLink: { color: C.textSecondary, fontSize: 14, fontWeight: "500" },
  navCta: {
    backgroundColor: C.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  navCtaText: { color: C.white, fontSize: 14, fontWeight: "700" },

  /* Hero */
  hero: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 60,
    maxWidth: maxW,
    width: "100%",
    alignSelf: "center",
    flexDirection: isWide ? "row" : "column",
    alignItems: "center",
    gap: 40,
    overflow: "hidden",
  },
  heroGlow: {
    position: "absolute",
    top: -100,
    left: "30%",
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: "rgba(16,185,129,0.08)",
  },
  heroContent: {
    flex: 1,
    gap: 20,
    alignItems: isWide ? "flex-start" : "center",
  },
  heroBadge: {
    backgroundColor: "rgba(16,185,129,0.12)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.25)",
  },
  heroBadgeText: { color: C.primary, fontSize: 13, fontWeight: "600" },
  heroTitle: {
    fontSize: isWide ? 52 : 38,
    fontWeight: "900",
    color: C.white,
    lineHeight: isWide ? 62 : 46,
    textAlign: isWide ? "left" : "center",
  },
  heroSubtitle: {
    fontSize: 17,
    color: C.textSecondary,
    lineHeight: 28,
    maxWidth: 520,
    textAlign: isWide ? "left" : "center",
  },
  heroBtnRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  heroPrimaryBtn: {
    backgroundColor: C.primary,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 14,
  },
  heroPrimaryBtnText: { color: C.white, fontSize: 16, fontWeight: "700" },
  heroSecondaryBtn: {
    borderWidth: 1.5,
    borderColor: C.border,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 14,
  },
  heroSecondaryBtnText: { color: C.textPrimary, fontSize: 16, fontWeight: "600" },
  heroNote: { color: C.textMuted, fontSize: 13 },

  /* Hero phone mockup */
  heroVisual: {
    alignItems: "center",
    justifyContent: "center",
  },
  phoneFrame: {
    width: 280,
    height: 500,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: C.border,
    backgroundColor: C.bg,
    overflow: "hidden",
    padding: 12,
  },
  phoneScreen: {
    flex: 1,
    backgroundColor: C.bgCard,
    borderRadius: 24,
    padding: 20,
  },
  phoneHeader: { gap: 4 },
  phoneMiniCards: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  phoneMiniCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    gap: 4,
  },

  /* Stats */
  statsBar: {
    flexDirection: isWide ? "row" : "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 24,
    paddingVertical: 40,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: C.border,
    backgroundColor: C.bgCard,
  },
  statCard: { alignItems: "center", minWidth: 120 },
  statValue: { color: C.primary, fontSize: 32, fontWeight: "900" },
  statLabel: { color: C.textSecondary, fontSize: 14, marginTop: 4 },

  /* Sections */
  section: {
    paddingHorizontal: 24,
    paddingVertical: 64,
    maxWidth: maxW,
    width: "100%",
    alignSelf: "center",
  },
  sectionLabel: {
    color: C.primary,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 2,
    textAlign: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    color: C.white,
    fontSize: isWide ? 38 : 28,
    fontWeight: "900",
    textAlign: "center",
    lineHeight: isWide ? 48 : 36,
    marginBottom: 12,
  },
  sectionSubtitle: {
    color: C.textSecondary,
    fontSize: 16,
    textAlign: "center",
    lineHeight: 26,
    maxWidth: 600,
    alignSelf: "center",
    marginBottom: 40,
  },

  /* Features grid */
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 20,
    marginTop: 20,
  },
  featureCard: {
    backgroundColor: C.bgCard,
    borderRadius: 16,
    padding: 24,
    width: isWide ? 340 : "100%",
    borderWidth: 1,
    borderColor: C.border,
  },
  featureEmoji: { fontSize: 36, marginBottom: 12 },
  featureTitle: { color: C.white, fontSize: 18, fontWeight: "700", marginBottom: 8 },
  featureDesc: { color: C.textSecondary, fontSize: 14, lineHeight: 22 },

  /* Steps */
  stepsRow: {
    flexDirection: isWide ? "row" : "column",
    gap: 24,
    marginTop: 40,
    justifyContent: "center",
  },
  stepCard: {
    flex: 1,
    alignItems: "center",
    gap: 12,
    maxWidth: 320,
    alignSelf: "center",
  },
  stepNumber: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: { color: C.white, fontSize: 20, fontWeight: "800" },
  stepTitle: { color: C.white, fontSize: 18, fontWeight: "700", textAlign: "center" },
  stepDesc: { color: C.textSecondary, fontSize: 14, lineHeight: 22, textAlign: "center" },

  /* Insights */
  insightsRow: {
    flexDirection: isWide ? "row" : "column",
    gap: 40,
    alignItems: "center",
    marginTop: 20,
  },
  insightsChart: {
    backgroundColor: C.bgCard,
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    minWidth: 240,
  },
  insightsInfo: {
    flex: 1,
    maxWidth: 480,
  },

  /* Pricing */
  pricingRow: {
    flexDirection: isWide ? "row" : "column",
    gap: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  pricingCard: {
    backgroundColor: C.bg,
    borderRadius: 20,
    padding: 28,
    width: isWide ? 320 : "100%",
    maxWidth: 360,
    borderWidth: 1,
    borderColor: C.border,
  },
  popularBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  popularText: { color: C.white, fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  pricingName: { fontSize: 20, fontWeight: "700" },
  pricingPrice: { color: C.white, fontSize: 42, fontWeight: "900" },
  pricingPeriod: { color: C.textMuted, fontSize: 16, marginBottom: 6, marginLeft: 4 },
  pricingFeatureRow: { flexDirection: "row", gap: 10, marginTop: 12, alignItems: "center" },
  pricingCheck: { fontSize: 16, fontWeight: "700" },
  pricingFeatureText: { color: C.textSecondary, fontSize: 14 },

  /* Testimonials */
  testimonialsRow: {
    flexDirection: isWide ? "row" : "column",
    gap: 20,
    marginTop: 20,
  },
  testimonialCard: {
    flex: 1,
    backgroundColor: C.bgCard,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: C.border,
  },
  testimonialQuote: { color: C.textPrimary, fontSize: 15, lineHeight: 24, fontStyle: "italic" },
  testimonialName: { color: C.white, fontSize: 15, fontWeight: "700" },
  testimonialRole: { color: C.textMuted, fontSize: 13 },

  /* CTA */
  ctaSection: {
    paddingVertical: 80,
    paddingHorizontal: 24,
    alignItems: "center",
    overflow: "hidden",
  },
  ctaGlow: {
    position: "absolute",
    top: -50,
    width: 600,
    height: 600,
    borderRadius: 300,
    backgroundColor: "rgba(16,185,129,0.06)",
  },
  ctaTitle: { color: C.white, fontSize: isWide ? 42 : 30, fontWeight: "900", textAlign: "center" },
  ctaSubtitle: {
    color: C.textSecondary,
    fontSize: 17,
    textAlign: "center",
    lineHeight: 28,
    maxWidth: 500,
    marginTop: 16,
  },
  ctaBtn: {
    backgroundColor: C.primary,
    paddingHorizontal: 36,
    paddingVertical: 18,
    borderRadius: 14,
    marginTop: 28,
  },
  ctaBtnText: { color: C.white, fontSize: 18, fontWeight: "700" },

  /* Footer */
  footer: {
    paddingHorizontal: 24,
    backgroundColor: C.bgCard,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  footerInner: {
    maxWidth: maxW,
    width: "100%",
    alignSelf: "center",
    flexDirection: isWide ? "row" : "column",
    justifyContent: "space-between",
    alignItems: isWide ? "center" : "flex-start",
    gap: 20,
    paddingVertical: 32,
  },
  footerLink: { color: C.textSecondary, fontSize: 14 },
  footerDivider: { height: 1, backgroundColor: C.border },
});
