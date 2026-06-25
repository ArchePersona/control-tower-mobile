import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
  ImageBackground, useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/src/services/auth";
import { Colors, Fonts, Spacing, Radius } from "@/src/theme";

const towerBackground = require("../../assets/images/tower-background.png");
const demoEmail = process.env.EXPO_PUBLIC_DEMO_EMAIL || "operator@archepersona.com";
const demoPassword = process.env.EXPO_PUBLIC_DEMO_PASSWORD || "";

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
        <ScrollView
          contentContainerStyle={[
            s.container,
            {
              paddingTop: insets.top + (isMobile ? 44 : 64),
              paddingBottom: insets.bottom + 40,
            },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={s.loginHero}>
            <View style={s.towerIcon}>
              <Text style={s.towerIconText}>⌁</Text>
            </View>
            <Text style={s.appTitle} testID="app-title">CONTROL TOWER</Text>
            <Text style={s.companyName}>ARCHEPERSONA</Text>
            <Text style={s.subtitle}>The consequence layer for autonomous AI agents</Text>
          </View>

          <View style={[s.gatehouseLogin, isMobile && s.gatehouseLoginMobile]}>
            <View style={[s.loginCard, isMobile && s.loginCardMobile]}>
              <Text style={s.formTitle}>Operator Sign In</Text>

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
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={Colors.bg} />
                ) : (
                  <Text style={s.loginBtnText}>Enter Control Tower</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                testID="demo-login-button"
                style={[s.demoBtn, loading && s.loginBtnDisabled]}
                onPress={handleDemoLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Ionicons name="flash" size={18} color={Colors.blue} />
                <Text style={s.demoBtnText}>Demo Entry</Text>
              </TouchableOpacity>
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
  flex: { flex: 1, backgroundColor: Colors.bg },
  loginPage: {
    flex: 1,
    minHeight: "100%",
    backgroundColor: Colors.bg,
  },
  loginOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2, 6, 18, 0.68)",
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
  },
  loginHero: {
    position: "relative",
    zIndex: 2,
    alignItems: "center",
    paddingBottom: Spacing.xl,
  },
  towerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(139, 92, 246, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.42)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  towerIconText: {
    fontFamily: Fonts.display,
    fontSize: 30,
    color: Colors.purple,
    lineHeight: 34,
  },
  appTitle: {
    fontFamily: Fonts.display,
    fontSize: 30,
    color: Colors.textPrimary,
    letterSpacing: 3,
    marginBottom: 6,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  companyName: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.blue,
    letterSpacing: 2.4,
    textTransform: "uppercase",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  gatehouseLogin: {
    position: "relative",
    zIndex: 2,
    width: "100%",
    alignItems: "flex-start",
    paddingTop: 28,
    paddingBottom: 36,
  },
  gatehouseLoginMobile: {
    alignItems: "center",
    paddingTop: 10,
  },
  loginCard: {
    width: "100%",
    maxWidth: 520,
    marginLeft: Platform.OS === "web" ? "8%" : 0,
    marginTop: Platform.OS === "web" ? 96 : 48,
    backgroundColor: "rgba(8, 14, 30, 0.82)",
    borderRadius: 20,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(77, 130, 255, 0.28)",
    shadowColor: Colors.black,
    shadowOpacity: 0.45,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 24 },
    elevation: 12,
  },
  loginCardMobile: {
    marginLeft: 0,
    marginTop: 28,
  },
  formTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 19,
    color: Colors.textPrimary,
    marginBottom: Spacing.xl,
  },
  inputGroup: { marginBottom: Spacing.lg },
  label: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.textSecondary,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: Spacing.sm,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.86)",
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: "rgba(51, 65, 85, 0.92)",
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
    backgroundColor: Colors.textPrimary,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.sm,
  },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.bg,
    letterSpacing: 0.5,
  },
  demoBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: "rgba(59, 130, 246, 0.12)",
    borderRadius: Radius.md,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.34)",
    marginTop: Spacing.md,
  },
  demoBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.blue,
    letterSpacing: 0.5,
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
    color: Colors.textSecondary,
    textAlign: "center",
  },
});
