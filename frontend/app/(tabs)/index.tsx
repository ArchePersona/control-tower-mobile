import React, { useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts, Spacing, Radius, statusColor, statusBg } from "@/src/theme";
import { getDashboardSummary } from "@/src/services/api";
import { useAuth } from "@/src/services/auth";

export default function TowerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signOut } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const d = await getDashboardSummary();
      setData(d);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  const onRefresh = () => fetchData(true);

  const timeAgo = (iso: string) => {
    if (!iso) return "";
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    return `${Math.floor(m / 60)}h ago`;
  };

  // Tab bar height + safe area bottom + breathing room
  const tabBarHeight = Platform.OS === "ios" ? 52 + insets.bottom : 60;
  const scrollPadding = tabBarHeight + 32;

  if (loading && !data) {
    return (
      <View style={[s.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.blue} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[s.container, { paddingTop: insets.top }]}
      contentContainerStyle={[s.content, { paddingBottom: scrollPadding }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.blue} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.title} testID="tower-title">CONTROL TOWER</Text>
          <Text style={s.statusLine}>
            {data?.status || "Operational Alpha"} · Updated {timeAgo(data?.last_updated)}
          </Text>
        </View>
        <TouchableOpacity testID="logout-button" onPress={signOut} style={s.profileBtn}>
          <Ionicons name="person-circle-outline" size={28} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Status Strip */}
      <TouchableOpacity
        testID="status-strip"
        style={s.statusStrip}
        onPress={() => router.push("/(tabs)/vhold")}
        activeOpacity={0.7}
      >
        <Ionicons name="pulse" size={16} color={Colors.blue} />
        <Text style={s.statusStripText}>{data?.status_message || "Loading..."}</Text>
      </TouchableOpacity>

      {/* Layer Cards */}
      <View style={s.cardsGrid}>
        {/* V-HOLD Card */}
        <TouchableOpacity
          testID="vhold-layer-card"
          style={[s.layerCard, { borderLeftColor: Colors.blue }]}
          onPress={() => router.push("/(tabs)/vhold")}
          activeOpacity={0.85}
        >
          <View style={s.cardHeader}>
            <View style={s.cardTitleRow}>
              <Ionicons name="shield-checkmark" size={18} color={Colors.blue} />
              <Text style={s.cardTitle}>V-HOLD</Text>
            </View>
            <Text style={s.cardRole}>Action Authority</Text>
          </View>
          <View style={s.cardBody}>
            <View style={s.metricRow}>
              <Text style={s.metricValue}>{data?.vhold?.pending || 0}</Text>
              <Text style={s.metricLabel}> waiting</Text>
            </View>
            <View style={s.metricRow}>
              <Text style={[s.metricValue, { color: Colors.orange }]}>{data?.vhold?.escalated || 0}</Text>
              <Text style={s.metricLabel}> escalated</Text>
            </View>
            {data?.vhold?.last_decision && (
              <Text style={s.cardNote}>Last: {data.vhold.last_decision}</Text>
            )}
          </View>
          <Text style={s.cardCta}>Tap to review actions →</Text>
        </TouchableOpacity>

        {/* COST BOSS Card */}
        <TouchableOpacity
          testID="cost-boss-layer-card"
          style={[s.layerCard, { borderLeftColor: Colors.purple }]}
          onPress={() => router.push("/(tabs)/cost")}
          activeOpacity={0.85}
        >
          <View style={s.cardHeader}>
            <View style={s.cardTitleRow}>
              <Ionicons name="trending-up" size={18} color={Colors.purple} />
              <Text style={[s.cardTitle, { color: Colors.purple }]}>COST BOSS</Text>
            </View>
            <Text style={s.cardRole}>Spend Strategy</Text>
          </View>
          <View style={s.cardBody}>
            <View style={s.metricRow}>
              <Text style={s.metricLabel}>Top mode: </Text>
              <Text style={[s.metricValue, { color: Colors.purple }]}>{data?.cost_boss?.top_strategy || "STANDARD"}</Text>
            </View>
            <View style={s.metricRow}>
              <Text style={s.metricValue}>{data?.cost_boss?.routes_today || 0}</Text>
              <Text style={s.metricLabel}> routes today</Text>
            </View>
            {(data?.cost_boss?.high_cost_routes || 0) > 0 && (
              <Text style={[s.cardNote, { color: Colors.orange }]}>
                {data.cost_boss.high_cost_routes} high-cost pending
              </Text>
            )}
          </View>
          <Text style={s.cardCta}>Tap to inspect spend strategy →</Text>
        </TouchableOpacity>

        {/* POLICY PRIMER Card */}
        <TouchableOpacity
          testID="policy-layer-card"
          style={[s.layerCard, { borderLeftColor: Colors.yellow }]}
          onPress={() => router.push("/(tabs)/policy")}
          activeOpacity={0.85}
        >
          <View style={s.cardHeader}>
            <View style={s.cardTitleRow}>
              <Ionicons name="document-text" size={18} color={Colors.yellow} />
              <Text style={[s.cardTitle, { color: Colors.yellow }]}>POLICY PRIMER</Text>
            </View>
            <Text style={s.cardRole}>Rule Guidance</Text>
          </View>
          <View style={s.cardBody}>
            <View style={s.metricRow}>
              <Text style={[s.metricValue, { color: Colors.red }]}>{data?.policy?.denied_actions || 0}</Text>
              <Text style={s.metricLabel}> denied actions</Text>
            </View>
            <View style={s.metricRow}>
              <Text style={[s.metricValue, { color: Colors.orange }]}>{data?.policy?.escalation_risks || 0}</Text>
              <Text style={s.metricLabel}> escalation risks</Text>
            </View>
            <View style={s.metricRow}>
              <Text style={s.metricValue}>{data?.policy?.policy_hits || 0}</Text>
              <Text style={s.metricLabel}> policy hits</Text>
            </View>
          </View>
          <Text style={s.cardCta}>Tap to inspect rules →</Text>
        </TouchableOpacity>

        {/* TRUST LADDER Card */}
        <TouchableOpacity
          testID="trust-ladder-layer-card"
          style={[s.layerCard, { borderLeftColor: Colors.green }]}
          onPress={() => router.push("/(tabs)/agents")}
          activeOpacity={0.85}
        >
          <View style={s.cardHeader}>
            <View style={s.cardTitleRow}>
              <Ionicons name="people" size={18} color={Colors.green} />
              <Text style={[s.cardTitle, { color: Colors.green }]}>TRUST LADDER</Text>
            </View>
            <Text style={s.cardRole}>Autonomy Progression</Text>
          </View>
          <View style={s.cardBody}>
            <View style={s.metricRow}>
              <Text style={s.metricValue}>{data?.trust_ladder?.active_agents || 0}</Text>
              <Text style={s.metricLabel}> active agents</Text>
            </View>
            <View style={s.metricRow}>
              <Text style={[s.metricValue, { color: Colors.yellow }]}>{data?.trust_ladder?.supervised || 0}</Text>
              <Text style={s.metricLabel}> supervised</Text>
            </View>
            <View style={s.metricRow}>
              <Text style={[s.metricValue, { color: Colors.green }]}>{data?.trust_ladder?.trusted || 0}</Text>
              <Text style={s.metricLabel}> trusted</Text>
            </View>
          </View>
          <Text style={s.cardCta}>Tap to inspect autonomy →</Text>
        </TouchableOpacity>
      </View>

      {/* Urgent Alerts */}
      {data?.alerts && data.alerts.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>URGENT ALERTS</Text>
          {data.alerts.map((alert: any, i: number) => (
            <TouchableOpacity
              key={i}
              testID={`alert-item-${i}`}
              style={s.alertRow}
              onPress={() => {
                if (alert.layer === "vhold") router.push("/(tabs)/vhold");
                else if (alert.layer === "cost") router.push("/(tabs)/cost");
                else if (alert.layer === "policy") router.push("/(tabs)/policy");
              }}
            >
              <Ionicons
                name={alert.type === "escalation" ? "warning" : alert.type === "cost" ? "cash" : "close-circle"}
                size={16}
                color={alert.type === "escalation" ? Colors.orange : alert.type === "cost" ? Colors.purple : Colors.red}
              />
              <Text style={s.alertText}>{alert.message}</Text>
              <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Recent Decisions */}
      {data?.recent_decisions && data.recent_decisions.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>RECENT DECISIONS</Text>
          {data.recent_decisions.map((d: any, i: number) => (
            <View key={i} testID={`recent-decision-${i}`} style={s.decisionRow}>
              <View style={[s.decisionDot, { backgroundColor: statusColor(d.decision) }]} />
              <View style={s.decisionContent}>
                <Text style={s.decisionText}>
                  <Text style={{ color: statusColor(d.decision), fontFamily: Fonts.bodySemiBold }}>
                    {d.decision?.charAt(0).toUpperCase() + d.decision?.slice(1)}
                  </Text>
                  {" · "}{d.agent_name} · {d.action_type}
                </Text>
                <Text style={s.decisionTime}>{timeAgo(d.decided_at)}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* System Health */}
      {data?.system_health && (
        <View style={[s.section, { marginBottom: 24 }]}>
          <Text style={s.sectionTitle}>SYSTEM HEALTH</Text>
          <View style={s.healthGrid}>
            <View style={s.healthItem}>
              <View style={[s.healthDot, { backgroundColor: Colors.green }]} />
              <Text style={s.healthLabel}>API</Text>
              <Text style={s.healthValue}>{data.system_health.api_health}</Text>
            </View>
            <View style={s.healthItem}>
              <View style={[s.healthDot, { backgroundColor: Colors.yellow }]} />
              <Text style={s.healthLabel}>Deploy</Text>
              <Text style={s.healthValue}>{data.system_health.deployment_status}</Text>
            </View>
            <View style={s.healthItem}>
              <View style={[s.healthDot, { backgroundColor: Colors.green }]} />
              <Text style={s.healthLabel}>Session</Text>
              <Text style={s.healthValue}>{data.system_health.session_status}</Text>
            </View>
          </View>
        </View>
      )}

      <Text style={s.footerMotto}>Character + Consequence = Trust.</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: Spacing.lg },
  loadingContainer: { flex: 1, backgroundColor: Colors.bg, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingTop: Spacing.lg, marginBottom: Spacing.md },
  title: { fontFamily: Fonts.display, fontSize: 22, color: Colors.textPrimary, letterSpacing: 2 },
  statusLine: { fontFamily: Fonts.body, fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  profileBtn: { padding: Spacing.xs },
  statusStrip: {
    flexDirection: "row", alignItems: "center", backgroundColor: Colors.surface,
    borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border,
  },
  statusStripText: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.textPrimary, marginLeft: Spacing.sm, flex: 1 },
  cardsGrid: { gap: Spacing.md, marginBottom: Spacing.lg },
  layerCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1,
    borderColor: Colors.border, borderLeftWidth: 3, overflow: "hidden",
  },
  cardHeader: { padding: Spacing.md, paddingBottom: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  cardTitle: { fontFamily: Fonts.bodyExtraBold, fontSize: 14, color: Colors.blue, letterSpacing: 1.5, textTransform: "uppercase" },
  cardRole: { fontFamily: Fonts.body, fontSize: 11, color: Colors.textMuted, marginTop: 2, marginLeft: 26 },
  cardBody: { padding: Spacing.md, paddingTop: Spacing.sm, gap: 4 },
  metricRow: { flexDirection: "row", alignItems: "baseline" },
  metricValue: { fontFamily: Fonts.bodyBold, fontSize: 16, color: Colors.textPrimary },
  metricLabel: { fontFamily: Fonts.body, fontSize: 13, color: Colors.textSecondary },
  cardNote: { fontFamily: Fonts.body, fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  cardCta: { fontFamily: Fonts.bodySemiBold, fontSize: 11, color: Colors.textMuted, paddingHorizontal: Spacing.md, paddingBottom: Spacing.md, letterSpacing: 0.3 },
  section: { marginBottom: Spacing.lg },
  sectionTitle: { fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.textMuted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: Spacing.sm },
  alertRow: {
    flexDirection: "row", alignItems: "center", backgroundColor: Colors.surface,
    borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.xs,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm,
  },
  alertText: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.textPrimary, flex: 1 },
  decisionRow: { flexDirection: "row", alignItems: "flex-start", paddingVertical: Spacing.sm, gap: Spacing.sm },
  decisionDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  decisionContent: { flex: 1 },
  decisionText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.textSecondary },
  decisionTime: { fontFamily: Fonts.body, fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  healthGrid: { flexDirection: "row", gap: Spacing.md },
  healthItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  healthDot: { width: 6, height: 6, borderRadius: 3 },
  healthLabel: { fontFamily: Fonts.bodySemiBold, fontSize: 11, color: Colors.textSecondary },
  healthValue: { fontFamily: Fonts.body, fontSize: 11, color: Colors.textMuted },
  footerMotto: { fontFamily: Fonts.bodySemiBold, fontSize: 12, color: Colors.textMuted, textAlign: "center", marginTop: Spacing.sm, marginBottom: Spacing.lg },
});
