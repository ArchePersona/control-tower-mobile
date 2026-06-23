import { Redirect } from "expo-router";
import { useAuth } from "@/src/services/auth";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Colors } from "@/src/theme";

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={s.container}>
        <ActivityIndicator size="large" color={Colors.blue} />
      </View>
    );
  }

  if (user) return <Redirect href="/(tabs)" />;
  return <Redirect href="/(auth)/login" />;
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, justifyContent: "center", alignItems: "center" },
});
