import React, { useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts, Spacing, Radius, riskColor } from "@/src/theme";
import { getPolicySummary, getPolicyRules } from "@/src/services/api";

export default function PolicyScreen() {
  const insets = useSafeAreaInsets();
  const [summary, setSummary] = useState<any>(null);
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [s, r] = await Promise.all([getPolicySummary(), getPolicyRules()]);
      setSummary(s);
      setRules(r);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  if (loading && !summary) {
    return <View style={[s.loadingContainer, { paddingTop: insets.top }]}><ActivityIndicator size="large" color={Colors.yellow} /></View>;
  }

  return (
    <ScrollView
      style={[s.container, { paddingTop: insets.top }]}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={Colors.yellow} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title} testID="policy-title">POLICY PRIMER</Text>
        <Text style={s.subtitle}>Rule Guidance</Text>
        <Text style={s.description}>Shows what agents are allowed to do, blocked from doing, or required to escalate.</Text>
      </View>

      {/* Summary */}
      <View style={s.metricsGrid}>
        <View style={s.metricCard}>
          <Text style={[s.metricValue, { color: Colors.red }]}>{summary?.denied_actions || 0}</Text>
          <Text style={s.metricLabel}>Denied</Text>
        </View>
        <View style={s.metricCard}>
          <Text style={[s.metricValue, { color: Colors.orange }]}>{summary?.escalation_risks || 0}</Text>
          <Text style={s.metricLabel}>Escalation Risks</Text>
        </View>
        <View style={s.metricCard}>
          <Text style={[s.metricValue, { color: Colors.yellow }]}>{summary?.policy_hits_count || 0}</Text>
          <Text style={s.metricLabel}>Policy Hits</Text>
        </View>
        <View style={s.metricCard}>
          <Text style={s.metricValue}>{summary?.rules_count || 0}</Text>
          <Text style={s.metricLabel}>Active Rules</Text>
        </View>
      </View>

      {/* Recent Blocked */}
      {summary?.recent_blocked?.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>RECENT BLOCKED ACTIONS</Text>
          {summary.recent_blocked.map((b: any, i: number) => (
            <View key={i} testID={`blocked-action-${i}`} style={s.blockedRow}>
              <View style={[s.blockedDot, { backgroundColor: Colors.red }]} />
              <View style={s.blockedContent}>
                <Text style={s.blockedAgent}>{b.agent} · {b.action}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Recent Escalated */}
      {summary?.recent_escalated?.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>RECENT ESCALATED ACTIONS</Text>
          {summary.recent_escalated.map((e: any, i: number) => (
            <View key={i} testID={`escalated-action-${i}`} style={s.blockedRow}>
              <View style={[s.blockedDot, { backgroundColor: Colors.orange }]} />
              <View style={s.blockedContent}>
                <Text style={s.blockedAgent}>{e.agent} · {e.action}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Policy Rules */}
      <Text style={s.sectionTitle}>POLICY RULES</Text>
      {rules.length === 0 ? (
        <View style={s.emptyState}>
          <Text style={s.emptyText}>No policy rules configured.</Text>
        </View>
      ) : (
        rules.map((rule) => (
          <TouchableOpacity
            key={rule.id}
            testID={`rule-card-${rule.id}`}
            style={s.ruleCard}
            onPress={() => setExpanded(expanded === rule.id ? null : rule.id)}
            activeOpacity={0.85}
          >
            <View style={s.ruleHeader}>
              <View style={s.ruleTitleRow}>
                <View style={[s.riskDot, { backgroundColor: riskColor(rule.risk_level) }]} />
                <Text style={s.ruleName}>{rule.name}</Text>
              </View>
              <View style={[s.riskBadge, { backgroundColor: `${riskColor(rule.risk_level)}15`, borderColor: `${riskColor(rule.risk_level)}40` }]}>
                <Text style={[s.riskBadgeText, { color: riskColor(rule.risk_level) }]}>{rule.risk_level}</Text>
              </View>
            </View>
            <Text style={s.ruleControls}>{rule.controls}</Text>

            {expanded === rule.id && (
              <View style={s.expandedContent}>
                <Text style={s.expandedLabel}>WHY IT MATTERS</Text>
                <Text style={s.expandedText}>{rule.why_matters}</Text>
                <Text style={s.expandedLabel}>WHEN TRIGGERED</Text>
                <Text style={s.expandedText}>{rule.trigger_action}</Text>
                {rule.affected_actions?.length > 0 && (
                  <>
                    <Text style={s.expandedLabel}>AFFECTED ACTIONS</Text>
                    <View style={s.tagsRow}>
                      {rule.affected_actions.map((a: string, i: number) => (
                        <View key={i} style={s.actionTag}>
                          <Text style={s.actionTagText}>{a}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}
              </View>
            )}
          </TouchableOpacity>
        ))
      )}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: 32 },
  loadingContainer: { flex: 1, backgroundColor: Colors.bg, justifyContent: "center", alignItems: "center" },
  header: { paddingTop: Spacing.lg, marginBottom: Spacing.lg },
  title: { fontFamily: Fonts.display, fontSize: 20, color: Colors.yellow, letterSpacing: 2 },
  subtitle: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  description: { fontFamily: Fonts.body, fontSize: 12, color: Colors.textMuted, marginTop: Spacing.sm },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm, marginBottom: Spacing.xl },
  metricCard: { flex: 1, minWidth: "45%", backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, alignItems: "center" },
  metricValue: { fontFamily: Fonts.bodyExtraBold, fontSize: 20, color: Colors.textPrimary },
  metricLabel: { fontFamily: Fonts.body, fontSize: 11, color: Colors.textMuted, marginTop: 2, textTransform: "uppercase", letterSpacing: 0.5 },
  section: { marginBottom: Spacing.lg },
  sectionTitle: { fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.textMuted, letterSpacing: 1.5, marginBottom: Spacing.sm },
  blockedRow: { flexDirection: "row", alignItems: "center", paddingVertical: 6, gap: Spacing.sm },
  blockedDot: { width: 8, height: 8, borderRadius: 4 },
  blockedContent: { flex: 1 },
  blockedAgent: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.textSecondary },
  emptyState: { paddingVertical: 20, alignItems: "center" },
  emptyText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.textMuted },
  ruleCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  ruleHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  ruleTitleRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  riskDot: { width: 8, height: 8, borderRadius: 4 },
  ruleName: { fontFamily: Fonts.bodyExtraBold, fontSize: 14, color: Colors.textPrimary, letterSpacing: 0.5 },
  riskBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.sm, borderWidth: 1 },
  riskBadgeText: { fontFamily: Fonts.bodyBold, fontSize: 10, letterSpacing: 0.5, textTransform: "uppercase" },
  ruleControls: { fontFamily: Fonts.body, fontSize: 13, color: Colors.textSecondary },
  expandedContent: { marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border },
  expandedLabel: { fontFamily: Fonts.bodySemiBold, fontSize: 10, color: Colors.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4, marginTop: Spacing.sm },
  expandedText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.textSecondary },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  actionTag: { backgroundColor: Colors.surfaceRaised, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border },
  actionTagText: { fontFamily: Fonts.bodySemiBold, fontSize: 11, color: Colors.textSecondary },
});
