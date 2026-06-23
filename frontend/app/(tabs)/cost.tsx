import React, { useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts, Spacing, Radius, strategyColor } from "@/src/theme";
import { getCostBossSummary, getCostBossStrategies } from "@/src/services/api";

const strategyIcons: Record<string, string> = {
  ECONOMY: "flash-outline",
  STANDARD: "layers-outline",
  REASONING: "bulb-outline",
  RESEARCH: "search-outline",
  PANEL: "grid-outline",
  AGGREGATE: "git-merge-outline",
  ESCALATE: "arrow-up-circle-outline",
};

export default function CostBossScreen() {
  const insets = useSafeAreaInsets();
  const [summary, setSummary] = useState<any>(null);
  const [strategies, setStrategies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [s, st] = await Promise.all([getCostBossSummary(), getCostBossStrategies()]);
      setSummary(s);
      setStrategies(st);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  if (loading && !summary) {
    return <View style={[s.loadingContainer, { paddingTop: insets.top }]}><ActivityIndicator size="large" color={Colors.purple} /></View>;
  }

  return (
    <ScrollView
      style={[s.container, { paddingTop: insets.top }]}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={Colors.purple} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title} testID="cost-boss-title">COST BOSS</Text>
        <Text style={s.subtitle}>Spend Strategy</Text>
        <Text style={s.description}>Decides when to save, when to spend, and when comparison matters.</Text>
      </View>

      {/* Summary Metrics */}
      <View style={s.metricsGrid}>
        <View style={s.metricCard}>
          <Text style={s.metricValue}>{summary?.routes_today || 0}</Text>
          <Text style={s.metricLabel}>Routes Today</Text>
        </View>
        <View style={s.metricCard}>
          <Text style={[s.metricValue, { color: Colors.purple }]}>{summary?.top_strategy || "—"}</Text>
          <Text style={s.metricLabel}>Top Strategy</Text>
        </View>
        <View style={s.metricCard}>
          <Text style={[s.metricValue, { color: Colors.orange }]}>{summary?.high_cost_routes || 0}</Text>
          <Text style={s.metricLabel}>High-Cost</Text>
        </View>
        <View style={s.metricCard}>
          <Text style={[s.metricValue, { color: Colors.red }]}>{summary?.authority_required || 0}</Text>
          <Text style={s.metricLabel}>Need Auth</Text>
        </View>
      </View>

      {/* Strategy Modes */}
      <Text style={s.sectionTitle}>STRATEGY MODES</Text>
      <Text style={s.sectionNote}>COST BOSS proposes spend. V-HOLD validates authority.</Text>

      {strategies.map((strat) => (
        <TouchableOpacity
          key={strat.mode}
          testID={`strategy-card-${strat.mode}`}
          style={s.strategyCard}
          onPress={() => setExpanded(expanded === strat.mode ? null : strat.mode)}
          activeOpacity={0.85}
        >
          <View style={s.stratHeader}>
            <View style={s.stratTitleRow}>
              <Ionicons
                name={strategyIcons[strat.mode] as any || "ellipse-outline"}
                size={18}
                color={strategyColor(strat.mode)}
              />
              <Text style={[s.stratTitle, { color: strategyColor(strat.mode) }]}>{strat.mode}</Text>
              {strat.usage_count > 0 && (
                <View style={[s.usageBadge, { backgroundColor: `${strategyColor(strat.mode)}15`, borderColor: `${strategyColor(strat.mode)}40` }]}>
                  <Text style={[s.usageBadgeText, { color: strategyColor(strat.mode) }]}>{strat.usage_count}</Text>
                </View>
              )}
            </View>
            <Ionicons name={expanded === strat.mode ? "chevron-up" : "chevron-down"} size={18} color={Colors.textMuted} />
          </View>
          <Text style={s.stratDescription}>{strat.description}</Text>

          {strat.requires_vhold && (
            <View style={s.vholdTag}>
              <Ionicons name="shield-checkmark" size={12} color={Colors.blue} />
              <Text style={s.vholdTagText}>Requires V-HOLD authority</Text>
            </View>
          )}

          {expanded === strat.mode && (
            <View style={s.expandedContent}>
              {strat.recent_uses && strat.recent_uses.length > 0 && (
                <>
                  <Text style={s.expandedLabel}>Recent Uses</Text>
                  {strat.recent_uses.map((use: any, i: number) => (
                    <View key={i} style={s.useRow}>
                      <Text style={s.useName}>{use.agent}</Text>
                      <Text style={s.useAction}>{use.action}</Text>
                      <Text style={[s.useStatus, { color: use.status === "approved" ? Colors.green : use.status === "denied" ? Colors.red : Colors.blue }]}>
                        {use.status}
                      </Text>
                    </View>
                  ))}
                </>
              )}
            </View>
          )}
        </TouchableOpacity>
      ))}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: 32 },
  loadingContainer: { flex: 1, backgroundColor: Colors.bg, justifyContent: "center", alignItems: "center" },
  header: { paddingTop: Spacing.lg, marginBottom: Spacing.lg },
  title: { fontFamily: Fonts.display, fontSize: 20, color: Colors.purple, letterSpacing: 2 },
  subtitle: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  description: { fontFamily: Fonts.body, fontSize: 12, color: Colors.textMuted, marginTop: Spacing.sm },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm, marginBottom: Spacing.xl },
  metricCard: { flex: 1, minWidth: "45%", backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, alignItems: "center" },
  metricValue: { fontFamily: Fonts.bodyExtraBold, fontSize: 20, color: Colors.textPrimary },
  metricLabel: { fontFamily: Fonts.body, fontSize: 11, color: Colors.textMuted, marginTop: 2, textTransform: "uppercase", letterSpacing: 0.5 },
  sectionTitle: { fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.textMuted, letterSpacing: 1.5, marginBottom: 4 },
  sectionNote: { fontFamily: Fonts.body, fontSize: 12, color: Colors.textMuted, marginBottom: Spacing.md },
  strategyCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  stratHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  stratTitleRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  stratTitle: { fontFamily: Fonts.bodyExtraBold, fontSize: 14, letterSpacing: 1 },
  usageBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: Radius.sm, borderWidth: 1 },
  usageBadgeText: { fontFamily: Fonts.bodyBold, fontSize: 10 },
  stratDescription: { fontFamily: Fonts.body, fontSize: 13, color: Colors.textSecondary, marginBottom: Spacing.sm },
  vholdTag: { flexDirection: "row", alignItems: "center", gap: 4 },
  vholdTagText: { fontFamily: Fonts.bodySemiBold, fontSize: 11, color: Colors.blue },
  expandedContent: { marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border },
  expandedLabel: { fontFamily: Fonts.bodySemiBold, fontSize: 11, color: Colors.textMuted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: Spacing.sm },
  useRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  useName: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.textPrimary, flex: 1 },
  useAction: { fontFamily: Fonts.body, fontSize: 12, color: Colors.textSecondary, flex: 1, textAlign: "center" },
  useStatus: { fontFamily: Fonts.bodySemiBold, fontSize: 12, flex: 1, textAlign: "right", textTransform: "uppercase" },
});
