import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
  ImageBackground, Image, useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/src/services/auth";
import { Colors, Fonts, Spacing, Radius } from "@/src/theme";

const towerBackground = require("../../assets/images/tower-background.png");
const archeLogo = require("../../assets/images/ArchePersonaLogo1.png");
const demoEmail = process.env.EXPO_PUBLIC_DEMO_EMAIL || "operator@archepersona.com";
const demoPassword = process.env.EXPO_PUBLIC_DEMO_PASSWORD || "";

const moduleStatus = [
  { label: "V-HOLD", status: "ACTIVE", icon: "shield-checkmark", color: "#3b82f6" },
  { label: "POLICY PRIMER", status: "READY", icon: "document-text", color: "#f59e0b" },
  { label: "COST BOSS", status: "STANDBY", icon: "trending-up", color: "#8b5cf6" },
  { label: "TRUST LADDER", status: "ONLINE", icon: "people", color: "#22c55e" },
] as const;

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await signIn(email.trim().toLowerCase(), password);
    } catch (e: any) {
      setError(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    if (!demoPassword) {
      setError("Demo entry is not configured for this deployment");
      return;
    }
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError("");
    setLoading(true);
    try {
      await signIn(demoEmail, demoPassword);
    } catch (e: any) {
      setError(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ImageBackground source={towerBackground} style={s.loginPage} resizeMode="cover">
        <View style={s.loginOverlay} />
        <View style={s.goldWash} />
        <ScrollView
          style={s.scroll}
          contentContainerStyle={[
            s.container,
            {
              paddingTop: insets.top + (isMobile ? 34 : 54),
              paddingBottom: insets.bottom + 34,
            },
          ]}
          horizontal={false}
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={s.loginHero}>
            <View style={s.logoFrame}>
              <Image source={archeLogo} style={s.logoImage} resizeMode="contain" />
            </View>

            <View style={s.heroDivider} />

            <Text style={[s.appTitle, isMobile && s.appTitleMobile]} testID="app-title">CONTROL TOWER</Text>
            <Text style={s.companyName}>POWERED BY ARCHEPERSONA</Text>
            <Text style={s.subtitle}>The trust checkpoint between autonomous agents and business action.</Text>

            <View style={[s.trustMotif, isMobile && s.trustMotifMobile]}>
              <Text style={s.trustMotifText}>CHARACTER</Text>
              <View style={s.trustDot} />
              <Text style={s.trustMotifText}>CONSEQUENCE</Text>
              <View style={s.trustDot} />
              <Text style={s.trustMotifText}>TRUST</Text>
            </View>
          </View>

          <View style={[s.gatehouseLogin, isMobile && s.gatehouseLoginMobile]}>
            <View style={[s.loginCard, isMobile && s.loginCardMobile]}>
              <View style={s.cardHeader}>
                <View>
                  <Text style={s.formTitle}>Operator Access</Text>
                  <Text style={s.formSubtitle}>Review held, denied, and escalated agent actions before they become business consequences.</Text>
                </View>
                <View style={s.apBadge}>
                  <Text style={s.apBadgeText}>AP</Text>
                </View>
              </View>

              <View style={s.inputGroup}>
                <Text style={s.label}>Email</Text>
                <View style={s.inputWrapper}>
                  <Ionicons name="mail-outline" size={18} color={Colors.textMuted} style={s.inputIcon} />
                  <TextInput
                    testID="login-email-input"
                    style={s.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="operator@archepersona.com"
                    placeholderTextColor={Colors.textMuted}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoCorrect={false}
                    autoComplete="off"
                    textContentType="none"
                  />
                </View>
              </View>

              <View style={s.inputGroup}>
                <Text style={s.label}>Password</Text>
                <View style={s.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} style={s.inputIcon} />
                  <TextInput
                    testID="login-password-input"
                    style={[s.input, { flex: 1 }]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter password"
                    placeholderTextColor={Colors.textMuted}
                    secureTextEntry={!showPassword}
                    autoComplete="off"
                    textContentType="none"
                  />
                  <TouchableOpacity testID="toggle-password-btn" onPress={() => setShowPassword(!showPassword)} style={s.eyeBtn}>
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>

              {error ? (
                <View style={s.errorBox}>
                  <Ionicons name="alert-circle" size={16} color={Colors.red} />
                  <Text testID="login-error-text" style={s.errorText}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                testID="login-submit-button"
                style={[s.loginBtn, loading && s.loginBtnDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#050914" />
                ) : (
                  <Text style={s.loginBtnText}>Enter CONTROL TOWER</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                testID="demo-login-button"
                style={[s.demoBtn, loading && s.loginBtnDisabled]}
                onPress={handleDemoLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                <Ionicons name="flash" size={18} color="#f5c75f" />
                <Text style={s.demoBtnText}>Launch Demo Console</Text>
              </TouchableOpacity>
            </View>

            <View style={[s.moduleStrip, isMobile && s.moduleStripMobile]}>
              {moduleStatus.map((item) => (
                <View key={item.label} style={s.modulePill}>
                  <Ionicons name={item.icon as any} size={15} color={item.color} />
                  <View>
                    <Text style={s.moduleLabel}>{item.label}</Text>
                    <Text style={s.moduleState}>{item.status}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={s.footer}>
            <Text style={s.motto}>Character + Consequence = Trust.</Text>
          </View>
        </ScrollView>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bg, overflow: "hidden" },
  loginPage: {
    flex: 1,
    width: "100%",
    maxWidth: "100%",
    minHeight: "100%",
    backgroundColor: Colors.bg,
    overflow: "hidden",
  },
  scroll: {
    flex: 1,
    width: "100%",
    maxWidth: "100%",
    overflow: "hidden",
  },
  loginOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2, 6, 18, 0.76)",
  },
  goldWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(245, 199, 95, 0.05)",
  },
  container: {
    flexGrow: 1,
    width: "100%",
    maxWidth: "100%",
    overflow: "hidden",
    paddingHorizontal: Spacing.xl,
  },
  loginHero: {
    position: "relative",
    zIndex: 2,
    width: "100%",
    maxWidth: "100%",
    alignItems: "center",
    paddingBottom: Spacing.lg,
  },
  logoFrame: {
    width: 232,
    height: 88,
    maxWidth: "86%",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
    opacity: 0.98,
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  heroDivider: {
    width: 96,
    height: 1,
    backgroundColor: "rgba(245, 199, 95, 0.65)",
    marginBottom: Spacing.lg,
  },
  appTitle: {
    fontFamily: Fonts.display,
    fontSize: 32,
    color: Colors.textPrimary,
    letterSpacing: 3.6,
    marginBottom: 7,
    textAlign: "center",
    textShadowColor: "rgba(245, 199, 95, 0.2)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 16,
  },
  appTitleMobile: {
    fontSize: 24,
    letterSpacing: 2.2,
  },
  companyName: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: "#f5c75f",
    letterSpacing: 2.1,
    textTransform: "uppercase",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 15,
    color: "rgba(226, 232, 240, 0.86)",
    textAlign: "center",
    maxWidth: 620,
  },
  trustMotif: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "rgba(8, 14, 30, 0.55)",
    borderWidth: 1,
    borderColor: "rgba(245, 199, 95, 0.18)",
  },
  trustMotifMobile: {
    gap: 7,
    paddingHorizontal: Spacing.md,
  },
  trustMotifText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 10,
    color: "rgba(226, 232, 240, 0.72)",
    letterSpacing: 1.3,
  },
  trustDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#f5c75f",
  },
  gatehouseLogin: {
    position: "relative",
    zIndex: 2,
    width: "100%",
    maxWidth: "100%",
    alignItems: "flex-start",
    paddingTop: 18,
    paddingBottom: 26,
  },
  gatehouseLoginMobile: {
    alignItems: "center",
    paddingTop: 10,
  },
  loginCard: {
    width: "100%",
    maxWidth: 540,
    marginLeft: Platform.OS === "web" ? "8%" : 0,
    marginTop: Platform.OS === "web" ? 70 : 38,
    backgroundColor: "rgba(6, 12, 27, 0.86)",
    borderRadius: 22,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(245, 199, 95, 0.26)",
    shadowColor: Colors.black,
    shadowOpacity: 0.55,
    shadowRadius: 38,
    shadowOffset: { width: 0, height: 26 },
    elevation: 14,
  },
  loginCardMobile: {
    maxWidth: "100%",
    marginLeft: 0,
    marginTop: 24,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  formTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 20,
    color: Colors.textPrimary,
    marginBottom: 7,
  },
  formSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 19,
    color: "rgba(203, 213, 225, 0.78)",
    maxWidth: 382,
  },
  apBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(245, 199, 95, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(245, 199, 95, 0.42)",
  },
  apBadgeText: {
    fontFamily: Fonts.display,
    color: "#f5c75f",
    fontSize: 14,
    letterSpacing: 1,
  },
  inputGroup: { marginBottom: Spacing.lg },
  label: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: "rgba(203, 213, 225, 0.78)",
    letterSpacing: 1.1,
    textTransform: "uppercase",
    marginBottom: Spacing.sm,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.88)",
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: "rgba(96, 165, 250, 0.24)",
    paddingHorizontal: Spacing.md,
  },
  inputIcon: { marginRight: Spacing.sm },
  input: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.textPrimary,
    paddingVertical: Platform.OS === "ios" ? 14 : 12,
  },
  eyeBtn: { padding: Spacing.xs },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.redBg,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.redBorder,
  },
  errorText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.red,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  loginBtn: {
    backgroundColor: "#f5c75f",
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.sm,
    shadowColor: "#f5c75f",
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: "#050914",
    letterSpacing: 0.5,
  },
  demoBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: "rgba(245, 199, 95, 0.08)",
    borderRadius: Radius.md,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "rgba(245, 199, 95, 0.26)",
    marginTop: Spacing.md,
  },
  demoBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: "#f5c75f",
    letterSpacing: 0.5,
  },
  moduleStrip: {
    width: "100%",
    maxWidth: 720,
    marginLeft: Platform.OS === "web" ? "8%" : 0,
    marginTop: Spacing.lg,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  moduleStripMobile: {
    maxWidth: "100%",
    marginLeft: 0,
    justifyContent: "center",
  },
  modulePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: "rgba(8, 14, 30, 0.7)",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.18)",
  },
  moduleLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 10,
    color: "rgba(226, 232, 240, 0.82)",
    letterSpacing: 0.8,
  },
  moduleState: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    color: "#f5c75f",
    letterSpacing: 0.7,
  },
  footer: {
    position: "relative",
    zIndex: 2,
    alignItems: "center",
    marginTop: "auto",
    paddingBottom: Spacing.lg,
  },
  motto: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: "rgba(226, 232, 240, 0.72)",
    textAlign: "center",
  },
});