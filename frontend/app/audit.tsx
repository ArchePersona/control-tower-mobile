import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts, Spacing, Radius, statusColor, statusBg, riskColor, strategyColor } from "@/src/theme";
import { getAuditRecords } from "@/src/services/api";

const FILTERS = ["all", "approved", "denied", "held", "escalated"];

export default function AuditScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const filters = filter !== "all" ? { decision: filter } : undefined;
      const data = await getAuditRecords(filters);
      setRecords(data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchRecords(); }, [filter]);

  const timeAgo = (iso: string) => {
    if (!iso) return "";
    const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    return `${Math.floor(m / 60)}h ago`;
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity testID="audit-back-button" onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={s.title} testID="audit-title">AUDIT TRAIL</Text>
          <Text style={s.subtitle}>Evidence & Decision Records</Text>
        </View>
      </View>

      {/* Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filtersRow} style={s.filtersScroll}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            testID={`audit-filter-${f}`}
            style={[s.chip, filter === f && s.chipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[s.chipText, filter === f && s.chipTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Records */}
      <ScrollView style={s.list} contentContainerStyle={s.listContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color={Colors.blue} style={{ marginTop: 40 }} />
        ) : records.length === 0 ? (
          <View style={s.emptyState}>
            <Ionicons name="document-outline" size={48} color={Colors.textMuted} />
            <Text style={s.emptyTitle}>No audit records</Text>
            <Text style={s.emptySubtitle}>Decision records will appear here.</Text>
          </View>
        ) : (
          records.map((r, i) => (
            <View key={r.id || i} testID={`audit-record-${r.id}`} style={s.recordCard}>
              <View style={s.recordHeader}>
                <View style={s.recordTitleRow}>
                  <View style={[s.decisionDot, { backgroundColor: statusColor(r.decision) }]} />
                  <Text style={[s.recordDecision, { color: statusColor(r.decision) }]}>
                    {r.decision?.toUpperCase()}
                  </Text>
                </View>
                <Text style={s.recordTime}>{timeAgo(r.decided_at)}</Text>
              </View>

              <View style={s.recordBody}>
                <View style={s.recordRow}>
                  <Text style={s.recordLabel}>Agent</Text>
                  <Text style={s.recordValue}>{r.agent_name}</Text>
                </View>
                <View style={s.recordRow}>
                  <Text style={s.recordLabel}>Action</Text>
                  <Text style={s.recordValue}>{r.action_type}</Text>
                </View>
                <View style={s.recordRow}>
                  <Text style={s.recordLabel}>Risk</Text>
                  <Text style={[s.recordValue, { color: riskColor(r.risk_tier) }]}>{r.risk_tier}</Text>
                </View>
                <View style={s.recordRow}>
                  <Text style={s.recordLabel}>Strategy</Text>
                  <Text style={[s.recordValue, { color: strategyColor(r.cost_boss_strategy) }]}>{r.cost_boss_strategy}</Text>
                </View>
                <View style={s.recordRow}>
                  <Text style={s.recordLabel}>Trust Level</Text>
                  <Text style={s.recordValue}>{r.trust_level_at_decision}</Text>
                </View>
                <View style={s.recordRow}>
                  <Text style={s.recordLabel}>Decided By</Text>
                  <Text style={s.recordValue}>{r.decided_by}</Text>
                </View>
                {r.policy_hits?.length > 0 && (
                  <View style={s.recordRow}>
                    <Text style={s.recordLabel}>Policy Hits</Text>
                    <Text style={[s.recordValue, { color: Colors.yellow }]}>{r.policy_hits.join(", ")}</Text>
                  </View>
                )}
              </View>

              {r.operator_note ? (
                <View style={s.noteBox}>
                  <Text style={s.noteLabel}>Operator Note</Text>
                  <Text style={s.noteText}>{r.operator_note}</Text>
                </View>
              ) : null}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.sm, gap: Spacing.sm },
  backBtn: { padding: Spacing.xs },
  title: { fontFamily: Fonts.display, fontSize: 18, color: Colors.textPrimary, letterSpacing: 1.5 },
  subtitle: { fontFamily: Fonts.body, fontSize: 12, color: Colors.textSecondary },
  filtersScroll: { maxHeight: 56, paddingHorizontal: Spacing.lg },
  filtersRow: { flexDirection: "row", gap: Spacing.sm, paddingVertical: Spacing.sm },
  chip: { height: 36, paddingHorizontal: 14, justifyContent: "center", borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, flexShrink: 0 },
  chipActive: { backgroundColor: Colors.blueBg, borderColor: Colors.blueBorder },
  chipText: { fontFamily: Fonts.bodySemiBold, fontSize: 12, color: Colors.textMuted },
  chipTextActive: { color: Colors.blue },
  list: { flex: 1 },
  listContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: 32 },
  emptyState: { alignItems: "center", paddingTop: 60 },
  emptyTitle: { fontFamily: Fonts.bodyBold, fontSize: 16, color: Colors.textPrimary, marginTop: Spacing.md },
  emptySubtitle: { fontFamily: Fonts.body, fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  recordCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, overflow: "hidden" },
  recordHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  recordTitleRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  decisionDot: { width: 8, height: 8, borderRadius: 4 },
  recordDecision: { fontFamily: Fonts.bodyBold, fontSize: 13, letterSpacing: 0.5 },
  recordTime: { fontFamily: Fonts.body, fontSize: 11, color: Colors.textMuted },
  recordBody: { padding: Spacing.md },
  recordRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  recordLabel: { fontFamily: Fonts.body, fontSize: 12, color: Colors.textMuted },
  recordValue: { fontFamily: Fonts.bodySemiBold, fontSize: 12, color: Colors.textPrimary },
  noteBox: { backgroundColor: Colors.surfaceRaised, padding: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border },
  noteLabel: { fontFamily: Fonts.bodySemiBold, fontSize: 10, color: Colors.textMuted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4 },
  noteText: { fontFamily: Fonts.body, fontSize: 12, color: Colors.textSecondary },
});
