import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { LogBox, ActivityIndicator, View, StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";

import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import { ArchePersonaAuthProvider, useAuth } from "@/src/services/auth";
import { Colors } from "@/src/theme";

LogBox.ignoreAllLogs(true);
SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuth = segments[0] === "(auth)";
    if (!user && !inAuth) {
      router.replace("/(auth)/login");
    } else if (user && inAuth) {
      router.replace("/(tabs)");
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={loadStyles.container}>
        <ActivityIndicator size="large" color={Colors.blue} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bg } }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="proposal/[id]" options={{ presentation: "card" }} />
      <Stack.Screen name="audit" options={{ presentation: "card" }} />
    </Stack>
  );
}

const loadStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, justifyContent: "center", alignItems: "center" },
});

export default function RootLayout() {
  const [iconsLoaded, iconsError] = useIconFonts();
  const [fontsLoaded] = useFonts({
    Audiowide: require("../assets/fonts/Audiowide-Regular.ttf"),
    Manrope: require("../assets/fonts/Manrope-Regular.ttf"),
    "Manrope-Medium": require("../assets/fonts/Manrope-Medium.ttf"),
    "Manrope-SemiBold": require("../assets/fonts/Manrope-SemiBold.ttf"),
    "Manrope-Bold": require("../assets/fonts/Manrope-Bold.ttf"),
    "Manrope-ExtraBold": require("../assets/fonts/Manrope-ExtraBold.ttf"),
  });

  useEffect(() => {
    if ((iconsLoaded || iconsError) && fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [iconsLoaded, iconsError, fontsLoaded]);

  if ((!iconsLoaded && !iconsError) || !fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <ArchePersonaAuthProvider>
        <RootNavigator />
      </ArchePersonaAuthProvider>
    </SafeAreaProvider>
  );
}
