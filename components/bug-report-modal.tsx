import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";
import { getApiBaseUrl } from "@/constants/oauth";

const SCREEN_OPTIONS = [
  "Home / Dashboard",
  "Transactions",
  "Budget",
  "Savings",
  "Insights",
  "Profile / Settings",
  "Subscription",
  "Onboarding",
  "Website",
  "Other",
];

interface BugReportModalProps {
  visible: boolean;
  onClose: () => void;
}

export function BugReportModal({ visible, onClose }: BugReportModalProps) {
  const colors = useColors();
  const [description, setDescription] = useState("");
  const [selectedScreen, setSelectedScreen] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const resetForm = () => {
    setDescription("");
    setSelectedScreen("");
    setEmail("");
    setIsSubmitting(false);
    setSubmitted(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (description.trim().length < 5) {
      Alert.alert("Too Short", "Please describe the bug in at least 5 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/trpc/bugReport.submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          json: {
            description: description.trim(),
            screen: selectedScreen || undefined,
            platform: Platform.OS,
            email: email.trim() || undefined,
          },
        }),
      });

      const data = await response.json();

      if (data?.result?.data?.json?.success) {
        setSubmitted(true);
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        throw new Error(data?.error?.message || "Failed to submit bug report");
      }
    } catch (err: any) {
      Alert.alert(
        "Submission Failed",
        err?.message || "Something went wrong. Please try again later."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const s = getStyles(colors);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === "ios" ? "pageSheet" : undefined}
      transparent={Platform.OS === "web" || Platform.OS === "android"}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={s.overlay}
      >
        <View style={[s.container, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={s.header}>
            <TouchableOpacity onPress={handleClose}>
              <Text style={[s.headerBtn, { color: colors.muted }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[s.headerTitle, { color: colors.foreground }]}>Report a Bug</Text>
            <View style={{ width: 60 }} />
          </View>

          {submitted ? (
            /* Success state */
            <View style={s.successContainer}>
              <Text style={s.successEmoji}>✅</Text>
              <Text style={[s.successTitle, { color: colors.foreground }]}>
                Thank You!
              </Text>
              <Text style={[s.successMessage, { color: colors.muted }]}>
                Your bug report has been submitted. We'll look into it and work on a fix.
              </Text>
              <TouchableOpacity
                style={[s.doneBtn, { backgroundColor: colors.primary }]}
                onPress={handleClose}
              >
                <Text style={s.doneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Form */
            <ScrollView
              style={s.scrollView}
              contentContainerStyle={s.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Description */}
              <Text style={[s.label, { color: colors.foreground }]}>
                What happened? <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <TextInput
                style={[
                  s.textArea,
                  {
                    backgroundColor: colors.surface,
                    color: colors.foreground,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="Describe the bug you encountered..."
                placeholderTextColor={colors.muted}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                maxLength={2000}
                value={description}
                onChangeText={setDescription}
              />
              <Text style={[s.charCount, { color: colors.muted }]}>
                {description.length}/2000
              </Text>

              {/* Screen selector */}
              <Text style={[s.label, { color: colors.foreground, marginTop: 16 }]}>
                Which screen?
              </Text>
              <View style={s.chipContainer}>
                {SCREEN_OPTIONS.map((screen) => (
                  <TouchableOpacity
                    key={screen}
                    style={[
                      s.chip,
                      {
                        backgroundColor:
                          selectedScreen === screen
                            ? colors.primary + "22"
                            : colors.surface,
                        borderColor:
                          selectedScreen === screen ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() =>
                      setSelectedScreen(selectedScreen === screen ? "" : screen)
                    }
                  >
                    <Text
                      style={[
                        s.chipText,
                        {
                          color:
                            selectedScreen === screen
                              ? colors.primary
                              : colors.foreground,
                        },
                      ]}
                    >
                      {screen}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Email (optional) */}
              <Text style={[s.label, { color: colors.foreground, marginTop: 16 }]}>
                Your email (optional)
              </Text>
              <Text style={[s.hint, { color: colors.muted }]}>
                So we can follow up with you about this bug
              </Text>
              <TextInput
                style={[
                  s.input,
                  {
                    backgroundColor: colors.surface,
                    color: colors.foreground,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="you@example.com"
                placeholderTextColor={colors.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
              />

              {/* Submit button */}
              <TouchableOpacity
                style={[
                  s.submitBtn,
                  {
                    backgroundColor: description.trim().length >= 5
                      ? colors.primary
                      : colors.muted + "44",
                  },
                ]}
                onPress={handleSubmit}
                disabled={isSubmitting || description.trim().length < 5}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={s.submitBtnText}>Submit Bug Report</Text>
                )}
              </TouchableOpacity>

              <Text style={[s.disclaimer, { color: colors.muted }]}>
                Bug reports are stored securely and only used to improve the app.
              </Text>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const getStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: Platform.OS === "web" || Platform.OS === "android"
        ? "rgba(0,0,0,0.5)"
        : "transparent",
      justifyContent: "flex-end",
    },
    container: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: "92%",
      minHeight: "60%",
      ...Platform.select({
        ios: { flex: 1 },
        default: {},
      }),
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    headerBtn: { fontSize: 16 },
    headerTitle: { fontSize: 17, fontWeight: "700" },
    scrollView: { flex: 1 },
    scrollContent: { padding: 20, paddingBottom: 40 },
    label: { fontSize: 15, fontWeight: "600", marginBottom: 8 },
    hint: { fontSize: 13, marginBottom: 8, marginTop: -4 },
    textArea: {
      borderWidth: 1,
      borderRadius: 12,
      padding: 14,
      fontSize: 15,
      minHeight: 120,
      lineHeight: 22,
    },
    charCount: { fontSize: 12, textAlign: "right", marginTop: 4 },
    chipContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
    },
    chipText: { fontSize: 13, fontWeight: "500" },
    input: {
      borderWidth: 1,
      borderRadius: 12,
      padding: 14,
      fontSize: 15,
    },
    submitBtn: {
      marginTop: 24,
      paddingVertical: 16,
      borderRadius: 14,
      alignItems: "center",
    },
    submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
    disclaimer: { fontSize: 12, textAlign: "center", marginTop: 12 },
    successContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 40,
    },
    successEmoji: { fontSize: 48, marginBottom: 16 },
    successTitle: { fontSize: 22, fontWeight: "700", marginBottom: 8 },
    successMessage: { fontSize: 15, textAlign: "center", lineHeight: 22, marginBottom: 24 },
    doneBtn: {
      paddingVertical: 14,
      paddingHorizontal: 40,
      borderRadius: 14,
    },
    doneBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  });
