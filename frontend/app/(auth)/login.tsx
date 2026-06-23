import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/src/services/auth";
import { Colors, Fonts, Spacing, Radius } from "@/src/theme";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
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

  return (
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[s.container, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Branding */}
        <View style={s.brandSection}>
          <View style={s.iconCircle}>
            <Ionicons name="radio" size={32} color={Colors.blue} />
          </View>
          <Text style={s.appTitle} testID="app-title">CONTROL TOWER</Text>
          <Text style={s.companyName}>ArchePersona</Text>
          <Text style={s.subtitle}>The consequence layer for autonomous AI agents</Text>
        </View>

        {/* Login Form */}
        <View style={s.form}>
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
              <Text style={s.loginBtnText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <View style={s.dividerRow}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>OR</Text>
            <View style={s.dividerLine} />
          </View>

          <TouchableOpacity
            testID="demo-login-button"
            style={[s.demoBtn, loading && s.loginBtnDisabled]}
            onPress={async () => {
              setEmail("operator@archepersona.com");
              setPassword("ControlTower2026!");
              setError("");
              setLoading(true);
              try {
                await signIn("operator@archepersona.com", "ControlTower2026!");
              } catch (e: any) {
                setError(e.message || "Login failed");
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Ionicons name="flash" size={18} color={Colors.blue} />
            <Text style={s.demoBtnText}>Demo Login</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.motto}>Character + Consequence = Trust.</Text>
          <Text style={s.version}>ARCHEngine · Operational Alpha</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bg },
  container: { flexGrow: 1, paddingHorizontal: Spacing.xl, justifyContent: "center" },
  brandSection: { alignItems: "center", marginBottom: 40 },
  iconCircle: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.blueBg,
    borderWidth: 1, borderColor: Colors.blueBorder, justifyContent: "center", alignItems: "center", marginBottom: Spacing.lg,
  },
  appTitle: { fontFamily: Fonts.display, fontSize: 28, color: Colors.textPrimary, letterSpacing: 3, marginBottom: 4 },
  companyName: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.blue, letterSpacing: 2, textTransform: "uppercase", marginBottom: Spacing.sm },
  subtitle: { fontFamily: Fonts.body, fontSize: 13, color: Colors.textSecondary, textAlign: "center" },
  form: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.xl,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 32,
  },
  formTitle: { fontFamily: Fonts.bodyBold, fontSize: 18, color: Colors.textPrimary, marginBottom: Spacing.xl },
  inputGroup: { marginBottom: Spacing.lg },
  label: { fontFamily: Fonts.bodySemiBold, fontSize: 12, color: Colors.textSecondary, letterSpacing: 1, textTransform: "uppercase", marginBottom: Spacing.sm },
  inputWrapper: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.surfaceRaised, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md,
  },
  inputIcon: { marginRight: Spacing.sm },
  input: { flex: 1, fontFamily: Fonts.body, fontSize: 15, color: Colors.textPrimary, paddingVertical: Platform.OS === "ios" ? 14 : 12 },
  eyeBtn: { padding: Spacing.xs },
  errorBox: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.redBg, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.redBorder },
  errorText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.red, marginLeft: Spacing.sm, flex: 1 },
  loginBtn: {
    backgroundColor: Colors.textPrimary, borderRadius: Radius.md, paddingVertical: 14,
    alignItems: "center", justifyContent: "center", marginTop: Spacing.sm,
  },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText: { fontFamily: Fonts.bodyBold, fontSize: 15, color: Colors.bg, letterSpacing: 0.5 },
  dividerRow: { flexDirection: "row", alignItems: "center", marginVertical: Spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontFamily: Fonts.bodySemiBold, fontSize: 11, color: Colors.textMuted, paddingHorizontal: Spacing.md, letterSpacing: 1 },
  demoBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: Spacing.sm,
    backgroundColor: Colors.blueBg, borderRadius: Radius.md, paddingVertical: 14,
    borderWidth: 1, borderColor: Colors.blueBorder,
  },
  demoBtnText: { fontFamily: Fonts.bodyBold, fontSize: 15, color: Colors.blue, letterSpacing: 0.5 },
  footer: { alignItems: "center" },
  motto: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.textSecondary, marginBottom: 4 },
  version: { fontFamily: Fonts.body, fontSize: 11, color: Colors.textMuted },
});
