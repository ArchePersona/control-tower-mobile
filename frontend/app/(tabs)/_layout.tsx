import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts } from "@/src/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform } from "react-native";

type TabIcon = React.ComponentProps<typeof Ionicons>["name"];

const tabs: { name: string; title: string; icon: TabIcon; iconActive: TabIcon }[] = [
  { name: "index", title: "Tower", icon: "layers-outline", iconActive: "layers" },
  { name: "vhold", title: "V-HOLD", icon: "shield-checkmark-outline", iconActive: "shield-checkmark" },
  { name: "cost", title: "Cost", icon: "trending-up-outline", iconActive: "trending-up" },
  { name: "policy", title: "Policy", icon: "document-text-outline", iconActive: "document-text" },
  { name: "agents", title: "Agents", icon: "people-outline", iconActive: "people" },
];

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  // Native Android can report a 0 bottom inset in Expo Go edge-to-edge mode.
  // Mobile web also needs extra clearance above the browser / Android nav controls.
  const bottomInset = Platform.OS === "ios"
    ? Math.max(insets.bottom, 16)
    : Math.max(insets.bottom, 64);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.bg,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingBottom: bottomInset,
          paddingTop: 10,
          height: 72 + bottomInset,
        },
        tabBarItemStyle: {
          paddingTop: 6,
          paddingBottom: 6,
        },
        tabBarActiveTintColor: Colors.textPrimary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontFamily: Fonts.bodySemiBold,
          fontSize: 10,
          letterSpacing: 0.5,
          textTransform: "uppercase",
          marginTop: 2,
        },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? tab.iconActive : tab.icon} size={22} color={color} />
            ),
            tabBarTestID: `tab-${tab.name}`,
          }}
        />
      ))}
    </Tabs>
  );
}
