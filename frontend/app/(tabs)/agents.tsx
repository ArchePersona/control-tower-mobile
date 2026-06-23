import React, { useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts, Spacing, Radius, trustColor } from "@/src/theme";
import { getAgents, getAgentDetail } from "@/src/services/api";

const RUNGS = ["restricted", "supervised", "operational", "expanded", "trusted"];

export default function AgentsScreen() {
  const insets = useSafeAreaInsets();
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const a = await getAgents();
      setAgents(a);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  const openDetail = async (agentId: string) => {
    setDetailVisible(true);
    setDetailLoading(true);
    try {
      const d = await getAgentDetail(agentId);
      setDetail(d);
    } catch {} finally { setDetailLoading(false); }
  };

  const rungIndex = (level: string) => RUNGS.indexOf(level);

  if (loading && !agents.length) {
    return <View style={[s.loadingContainer, { paddingTop: insets.top }]}><ActivityIndicator size="large" color={Colors.green} /></View>;
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={Colors.green} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.header}>
          <Text style={s.title} testID="agents-title">TRUST LADDER</Text>
          <Text style={s.subtitle}>Autonomy Progression</Text>
          <Text style={s.description}>Tracks how much autonomy each agent has earned through behavior.</Text>
        </View>

        {/* Ladder Visualization */}
        <View style={s.ladderRow}>
          {RUNGS.map((rung, i) => (
            <View key={rung} style={s.ladderItem}>
              <View style={[s.ladderDot, { backgroundColor: trustColor(rung) }]} />
              <Text style={[s.ladderLabel, { color: trustColor(rung) }]}>
                {rung.charAt(0).toUpperCase() + rung.slice(1)}
              </Text>
              {i < RUNGS.length - 1 && <View style={s.ladderLine} />}
            </View>
          ))}
        </View>

        {/* Agent Cards */}
        <Text style={s.sectionTitle}>AGENTS</Text>
        {agents.length === 0 ? (
          <View style={s.emptyState}>
            <Ionicons name="people-outline" size={48} color={Colors.textMuted} />
            <Text style={s.emptyText}>No agents registered.</Text>
          </View>
        ) : (
          agents.map((agent) => (
            <TouchableOpacity
              key={agent.id}
              testID={`agent-card-${agent.id}`}
              style={[s.agentCard, { borderLeftColor: trustColor(agent.autonomy_level) }]}
              onPress={() => openDetail(agent.id)}
              activeOpacity={0.85}
            >
              <View style={s.agentHeader}>
                <Text style={s.agentName}>{agent.name}</Text>
                <View style={[s.rungBadge, { backgroundColor: `${trustColor(agent.autonomy_level)}15`, borderColor: `${trustColor(agent.autonomy_level)}40` }]}>
                  <Text style={[s.rungBadgeText, { color: trustColor(agent.autonomy_level) }]}>
                    {agent.autonomy_level?.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={s.scoresRow}>
                <View style={s.scoreItem}>
                  <Text style={s.scoreValue}>{agent.trust_score}</Text>
                  <Text style={s.scoreLabel}>Trust</Text>
                </View>
                <View style={s.scoreItem}>
                  <Text style={s.scoreValue}>{agent.confidence_score}</Text>
                  <Text style={s.scoreLabel}>Confidence</Text>
                </View>
                <View style={s.scoreItem}>
                  <Text style={[s.scoreValue, { color: Colors.green }]}>{agent.approved_count}</Text>
                  <Text style={s.scoreLabel}>Approved</Text>
                </View>
                <View style={s.scoreItem}>
                  <Text style={[s.scoreValue, { color: Colors.red }]}>{agent.denied_count}</Text>
                  <Text style={s.scoreLabel}>Denied</Text>
                </View>
              </View>

              {/* Mini ladder */}
              <View style={s.miniLadder}>
                {RUNGS.map((rung, i) => (
                  <View
                    key={rung}
                    style={[
                      s.miniRung,
                      {
                        backgroundColor: i <= rungIndex(agent.autonomy_level) ? trustColor(agent.autonomy_level) : Colors.surfaceRaised,
                        opacity: i <= rungIndex(agent.autonomy_level) ? 1 : 0.3,
                      },
                    ]}
                  />
                ))}
              </View>

              <Text style={s.agentCta}>Tap to inspect →</Text>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Agent Detail Modal */}
      <Modal visible={detailVisible} animationType="slide" transparent onRequestClose={() => setDetailVisible(false)}>
        <TouchableOpacity style={s.modalBackdrop} onPress={() => setDetailVisible(false)} activeOpacity={1} />
        <View style={[s.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={s.modalHandle} />
          {detailLoading ? (
            <ActivityIndicator size="large" color={Colors.green} style={{ marginTop: 40 }} />
          ) : detail ? (
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={s.detailHeader}>
                <Text style={s.detailName}>{detail.agent?.name}</Text>
                <View style={[s.rungBadge, { backgroundColor: `${trustColor(detail.agent?.autonomy_level)}15`, borderColor: `${trustColor(detail.agent?.autonomy_level)}40` }]}>
                  <Text style={[s.rungBadgeText, { color: trustColor(detail.agent?.autonomy_level) }]}>
                    {detail.agent?.autonomy_level?.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={s.detailScores}>
                <View style={s.detailScoreItem}>
                  <Text style={s.detailScoreValue}>{detail.agent?.trust_score}</Text>
                  <Text style={s.detailScoreLabel}>Trust Score</Text>
                </View>
                <View style={s.detailScoreItem}>
                  <Text style={s.detailScoreValue}>{detail.agent?.confidence_score}</Text>
                  <Text style={s.detailScoreLabel}>Confidence</Text>
                </View>
              </View>

              <View style={s.detailStats}>
                <View style={s.statRow}>
                  <Text style={s.statLabel}>Approved</Text>
                  <Text style={[s.statValue, { color: Colors.green }]}>{detail.agent?.approved_count}</Text>
                </View>
                <View style={s.statRow}>
                  <Text style={s.statLabel}>Denied</Text>
                  <Text style={[s.statValue, { color: Colors.red }]}>{detail.agent?.denied_count}</Text>
                </View>
                <View style={s.statRow}>
                  <Text style={s.statLabel}>Held</Text>
                  <Text style={[s.statValue, { color: Colors.yellow }]}>{detail.agent?.held_count}</Text>
                </View>
                <View style={s.statRow}>
                  <Text style={s.statLabel}>Escalated</Text>
                  <Text style={[s.statValue, { color: Colors.orange }]}>{detail.agent?.escalated_count}</Text>
                </View>
                <View style={s.statRow}>
                  <Text style={s.statLabel}>Oversight</Text>
                  <Text style={s.statValue}>{detail.agent?.oversight_state}</Text>
                </View>
              </View>

              <Text style={s.detailSectionTitle}>MOVES UP</Text>
              <Text style={s.detailText}>{detail.moves_up}</Text>

              <Text style={s.detailSectionTitle}>MOVES DOWN</Text>
              <Text style={s.detailText}>{detail.moves_down}</Text>

              {detail.permission_envelope && (
                <>
                  <Text style={s.detailSectionTitle}>PERMISSION ENVELOPE</Text>
                  {Object.entries(detail.permission_envelope).map(([key, val]) => (
                    <View key={key} style={s.permRow}>
                      <Text style={s.permKey}>{key.replace(/_/g, " ")}</Text>
                      <Text style={[
                        s.permValue,
                        { color: val === true ? Colors.green : val === false ? Colors.red : Colors.yellow },
                      ]}>
                        {val === true ? "ALLOWED" : val === false ? "BLOCKED" : String(val).toUpperCase()}
                      </Text>
                    </View>
                  ))}
                </>
              )}

              {detail.audit_history?.length > 0 && (
                <>
                  <Text style={s.detailSectionTitle}>RECENT DECISIONS</Text>
                  {detail.audit_history.slice(0, 5).map((a: any, i: number) => (
                    <View key={i} style={s.auditRow}>
                      <View style={[s.auditDot, { backgroundColor: a.decision === "approved" ? Colors.green : a.decision === "denied" ? Colors.red : Colors.orange }]} />
                      <Text style={s.auditText}>{a.decision} · {a.action_type}</Text>
                    </View>
                  ))}
                </>
              )}

              <TouchableOpacity testID="close-agent-detail" style={s.closeBtn} onPress={() => setDetailVisible(false)}>
                <Text style={s.closeBtnText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: 32 },
  loadingContainer: { flex: 1, backgroundColor: Colors.bg, justifyContent: "center", alignItems: "center" },
  header: { paddingTop: Spacing.lg, marginBottom: Spacing.lg },
  title: { fontFamily: Fonts.display, fontSize: 20, color: Colors.green, letterSpacing: 2 },
  subtitle: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  description: { fontFamily: Fonts.body, fontSize: 12, color: Colors.textMuted, marginTop: Spacing.sm },
  ladderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  ladderItem: { alignItems: "center", flex: 1, flexDirection: "column", gap: 4 },
  ladderDot: { width: 10, height: 10, borderRadius: 5 },
  ladderLabel: { fontFamily: Fonts.bodySemiBold, fontSize: 8, textTransform: "uppercase", letterSpacing: 0.3 },
  ladderLine: { position: "absolute", right: -10, top: 5, width: 20, height: 1, backgroundColor: Colors.border },
  sectionTitle: { fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.textMuted, letterSpacing: 1.5, marginBottom: Spacing.sm },
  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.textMuted, marginTop: Spacing.sm },
  agentCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, borderLeftWidth: 3 },
  agentHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.sm },
  agentName: { fontFamily: Fonts.bodyExtraBold, fontSize: 18, color: Colors.textPrimary, letterSpacing: 1 },
  rungBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.sm, borderWidth: 1 },
  rungBadgeText: { fontFamily: Fonts.bodyBold, fontSize: 10, letterSpacing: 0.5, textTransform: "uppercase" },
  scoresRow: { flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.sm },
  scoreItem: { flex: 1, alignItems: "center" },
  scoreValue: { fontFamily: Fonts.bodyBold, fontSize: 16, color: Colors.textPrimary },
  scoreLabel: { fontFamily: Fonts.body, fontSize: 10, color: Colors.textMuted, textTransform: "uppercase" },
  miniLadder: { flexDirection: "row", gap: 3, marginBottom: Spacing.sm },
  miniRung: { flex: 1, height: 4, borderRadius: 2 },
  agentCta: { fontFamily: Fonts.bodySemiBold, fontSize: 11, color: Colors.textMuted },
  // Modal
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  modalSheet: { backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, maxHeight: "85%", position: "absolute", bottom: 0, left: 0, right: 0 },
  modalHandle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: "center", marginBottom: Spacing.lg },
  detailHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.md },
  detailName: { fontFamily: Fonts.bodyExtraBold, fontSize: 24, color: Colors.textPrimary, letterSpacing: 1 },
  detailScores: { flexDirection: "row", gap: Spacing.md, marginBottom: Spacing.md },
  detailScoreItem: { flex: 1, backgroundColor: Colors.surfaceRaised, borderRadius: Radius.md, padding: Spacing.md, alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  detailScoreValue: { fontFamily: Fonts.bodyExtraBold, fontSize: 28, color: Colors.textPrimary },
  detailScoreLabel: { fontFamily: Fonts.body, fontSize: 11, color: Colors.textMuted, textTransform: "uppercase", marginTop: 2 },
  detailStats: { backgroundColor: Colors.surfaceRaised, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  statRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  statLabel: { fontFamily: Fonts.body, fontSize: 13, color: Colors.textMuted },
  statValue: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.textPrimary },
  detailSectionTitle: { fontFamily: Fonts.bodySemiBold, fontSize: 10, color: Colors.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4, marginTop: Spacing.md },
  detailText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.textSecondary },
  permRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  permKey: { fontFamily: Fonts.body, fontSize: 12, color: Colors.textMuted, textTransform: "capitalize" },
  permValue: { fontFamily: Fonts.bodySemiBold, fontSize: 11, letterSpacing: 0.5 },
  auditRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, paddingVertical: 4 },
  auditDot: { width: 6, height: 6, borderRadius: 3 },
  auditText: { fontFamily: Fonts.body, fontSize: 12, color: Colors.textSecondary },
  closeBtn: { paddingVertical: 14, borderRadius: Radius.md, alignItems: "center", borderWidth: 1, borderColor: Colors.border, marginTop: Spacing.lg, marginBottom: Spacing.md },
  closeBtnText: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.textSecondary },
});
