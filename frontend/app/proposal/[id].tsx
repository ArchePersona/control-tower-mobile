import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts, Spacing, Radius, statusColor, statusBg, riskColor, strategyColor, trustColor } from "@/src/theme";
import { getProposalDetail, submitDecision } from "@/src/services/api";

export default function ProposalDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deciding, setDeciding] = useState(false);
  const [decisionResult, setDecisionResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [operatorNote, setOperatorNote] = useState("");

  useEffect(() => {
    if (id) fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const d = await getProposalDetail(id as string);
      setData(d);
    } catch {} finally { setLoading(false); }
  };

  const handleDecision = async (decision: string) => {
    setDeciding(true);
    try {
      await submitDecision(id as string, decision, operatorNote);
      setDecisionResult({ ok: true, msg: `Action ${decision} successfully.` });
      setTimeout(() => { router.back(); }, 1500);
    } catch (e: any) {
      setDecisionResult({ ok: false, msg: e.message || "Failed" });
    } finally { setDeciding(false); }
  };

  const p = data?.proposal;
  const agent = data?.agent;
  const cost = data?.cost_boss;
  const policy = data?.policy;

  if (loading) {
    return <View style={[s.loadingContainer, { paddingTop: insets.top }]}><ActivityIndicator size="large" color={Colors.blue} /></View>;
  }

  if (!p) {
    return (
      <View style={[s.loadingContainer, { paddingTop: insets.top }]}>
        <Text style={s.errorText}>Proposal not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={[s.container, { paddingTop: insets.top }]}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity testID="back-button" onPress={() => router.back()} style={s.headerBackBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={s.headerTitle}>
          <Text style={s.title}>V-HOLD REVIEW</Text>
          <Text style={s.proposalId}>{p.id}</Text>
        </View>
        <View style={[s.statusBadge, { backgroundColor: statusBg(p.status) }]}>
          <Text style={[s.statusText, { color: statusColor(p.status) }]}>{p.status?.toUpperCase()}</Text>
        </View>
      </View>

      {/* Section 1: Proposed Action */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>PROPOSED ACTION</Text>
        <View style={s.sectionCard}>
          <View style={s.row}><Text style={s.label}>Agent</Text><Text style={s.value}>{p.agent_name}</Text></View>
          <View style={s.row}><Text style={s.label}>Action Type</Text><Text style={s.value}>{p.action_type}</Text></View>
          <View style={s.row}><Text style={s.label}>Target System</Text><Text style={s.value}>{p.target_system || "—"}</Text></View>
          <View style={s.row}><Text style={s.label}>Target Entity</Text><Text style={s.value}>{p.target_entity || "—"}</Text></View>
          <View style={s.row}><Text style={s.label}>Outcome</Text><Text style={s.value}>{p.requested_outcome || "—"}</Text></View>
        </View>
      </View>

      {/* Section 2: Agent Reason */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>AGENT REASON</Text>
        <View style={s.sectionCard}>
          <Text style={s.reasonText}>{p.reason}</Text>
        </View>
      </View>

      {/* Section 3: V-HOLD Result */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>V-HOLD RESULT</Text>
        <View style={s.sectionCard}>
          <View style={s.row}><Text style={s.label}>Risk Tier</Text><Text style={[s.value, { color: riskColor(p.risk_tier) }]}>{p.risk_tier}</Text></View>
          <View style={s.row}><Text style={s.label}>Status</Text><Text style={[s.value, { color: statusColor(p.status) }]}>{p.status}</Text></View>
          <View style={s.row}><Text style={s.label}>Requires Review</Text><Text style={s.value}>{p.requires_vhold_authority ? "Yes" : "No"}</Text></View>
        </View>
      </View>

      {/* Section 4: Cost Boss */}
      {cost && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>COST BOSS STRATEGY</Text>
          <View style={s.sectionCard}>
            <View style={s.row}><Text style={s.label}>Strategy</Text><Text style={[s.value, { color: strategyColor(cost.strategy) }]}>{cost.strategy}</Text></View>
            <View style={s.row}><Text style={s.label}>Cost Tier</Text><Text style={s.value}>{cost.estimated_cost_tier}</Text></View>
            <View style={s.row}><Text style={s.label}>Authority</Text><Text style={s.value}>{cost.authority_status}</Text></View>
            <View style={s.row}><Text style={s.label}>Budget</Text><Text style={s.value}>{cost.budget_envelope}</Text></View>
            <Text style={s.reasonText}>{cost.reason}</Text>
          </View>
        </View>
      )}

      {/* Section 5: Policy */}
      {policy && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>POLICY PRIMER</Text>
          <View style={s.sectionCard}>
            {policy.denied_actions?.length > 0 && (
              <View style={s.row}><Text style={s.label}>Denied Actions</Text><Text style={[s.value, { color: Colors.red }]}>{policy.denied_actions.join(", ")}</Text></View>
            )}
            {policy.escalation_risks?.length > 0 && (
              <View style={s.row}><Text style={s.label}>Escalation Risks</Text><Text style={[s.value, { color: Colors.orange }]}>{policy.escalation_risks.join(", ")}</Text></View>
            )}
            {policy.policy_hits?.length > 0 && (
              <View style={s.row}><Text style={s.label}>Policy Hits</Text><Text style={[s.value, { color: Colors.yellow }]}>{policy.policy_hits.join(", ")}</Text></View>
            )}
            <Text style={s.reasonText}>{policy.explanation}</Text>
          </View>
        </View>
      )}

      {/* Section 6: Trust Ladder */}
      {agent && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>TRUST LADDER</Text>
          <View style={s.sectionCard}>
            <View style={s.row}><Text style={s.label}>Autonomy Rung</Text><Text style={[s.value, { color: trustColor(agent.autonomy_level) }]}>{agent.autonomy_level}</Text></View>
            <View style={s.row}><Text style={s.label}>Trust Score</Text><Text style={s.value}>{agent.trust_score}</Text></View>
            <View style={s.row}><Text style={s.label}>Confidence</Text><Text style={s.value}>{agent.confidence_score}</Text></View>
            <View style={s.row}><Text style={s.label}>Approvals</Text><Text style={[s.value, { color: Colors.green }]}>{agent.approved_count}</Text></View>
            <View style={s.row}><Text style={s.label}>Denials</Text><Text style={[s.value, { color: Colors.red }]}>{agent.denied_count}</Text></View>
          </View>
        </View>
      )}

      {/* Decision Result */}
      {decisionResult && (
        <View style={[s.resultBox, { borderColor: decisionResult.ok ? Colors.greenBorder : Colors.redBorder, backgroundColor: decisionResult.ok ? Colors.greenBg : Colors.redBg }]}>
          <Ionicons name={decisionResult.ok ? "checkmark-circle" : "close-circle"} size={20} color={decisionResult.ok ? Colors.green : Colors.red} />
          <Text style={[s.resultText, { color: decisionResult.ok ? Colors.green : Colors.red }]}>{decisionResult.msg}</Text>
        </View>
      )}

      {/* Section 7: Decision Controls */}
      {(p.status === "pending" || p.status === "held" || p.status === "escalated") && !decisionResult && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>DECISION</Text>
          <View style={s.decisionGrid}>
            <TouchableOpacity testID="detail-approve" style={[s.decisionBtn, { backgroundColor: Colors.greenBg, borderColor: Colors.greenBorder }]} onPress={() => handleDecision("approved")} disabled={deciding}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.green} />
              <Text style={[s.decisionBtnText, { color: Colors.green }]}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="detail-deny" style={[s.decisionBtn, { backgroundColor: Colors.redBg, borderColor: Colors.redBorder }]} onPress={() => handleDecision("denied")} disabled={deciding}>
              <Ionicons name="close-circle" size={20} color={Colors.red} />
              <Text style={[s.decisionBtnText, { color: Colors.red }]}>Deny</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="detail-hold" style={[s.decisionBtn, { backgroundColor: Colors.yellowBg, borderColor: Colors.yellowBorder }]} onPress={() => handleDecision("held")} disabled={deciding}>
              <Ionicons name="pause-circle" size={20} color={Colors.yellow} />
              <Text style={[s.decisionBtnText, { color: Colors.yellow }]}>Hold</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="detail-escalate" style={[s.decisionBtn, { backgroundColor: Colors.orangeBg, borderColor: Colors.orangeBorder }]} onPress={() => handleDecision("escalated")} disabled={deciding}>
              <Ionicons name="arrow-up-circle" size={20} color={Colors.orange} />
              <Text style={[s.decisionBtnText, { color: Colors.orange }]}>Escalate</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Audit Records */}
      {data?.audit_records?.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>AUDIT TRAIL</Text>
          {data.audit_records.map((a: any, i: number) => (
            <View key={i} style={s.auditRow}>
              <View style={[s.auditDot, { backgroundColor: statusColor(a.decision) }]} />
              <View style={s.auditContent}>
                <Text style={s.auditDecision}>{a.decision} by {a.decided_by}</Text>
                {a.operator_note ? <Text style={s.auditNote}>{a.operator_note}</Text> : null}
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: 32 },
  loadingContainer: { flex: 1, backgroundColor: Colors.bg, justifyContent: "center", alignItems: "center" },
  errorText: { fontFamily: Fonts.body, fontSize: 15, color: Colors.textSecondary },
  backBtn: { marginTop: Spacing.md, paddingVertical: 10, paddingHorizontal: 20, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border },
  backBtnText: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.blue },
  header: { flexDirection: "row", alignItems: "center", paddingTop: Spacing.lg, marginBottom: Spacing.lg },
  headerBackBtn: { padding: Spacing.xs, marginRight: Spacing.sm },
  headerTitle: { flex: 1 },
  title: { fontFamily: Fonts.display, fontSize: 16, color: Colors.blue, letterSpacing: 1.5 },
  proposalId: { fontFamily: Fonts.body, fontSize: 11, color: Colors.textMuted },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.sm },
  statusText: { fontFamily: Fonts.bodyBold, fontSize: 11, letterSpacing: 0.5 },
  section: { marginBottom: Spacing.lg },
  sectionTitle: { fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.textMuted, letterSpacing: 1.5, marginBottom: Spacing.sm },
  sectionCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  label: { fontFamily: Fonts.body, fontSize: 13, color: Colors.textMuted, flex: 1 },
  value: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.textPrimary, flex: 1, textAlign: "right" },
  reasonText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.textSecondary, marginTop: Spacing.sm },
  decisionGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  decisionBtn: { flex: 1, minWidth: "45%", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14, borderRadius: Radius.md, borderWidth: 1 },
  decisionBtnText: { fontFamily: Fonts.bodyBold, fontSize: 14 },
  resultBox: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1, marginBottom: Spacing.lg },
  resultText: { fontFamily: Fonts.bodySemiBold, fontSize: 14, flex: 1 },
  auditRow: { flexDirection: "row", gap: Spacing.sm, paddingVertical: 6 },
  auditDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  auditContent: { flex: 1 },
  auditDecision: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.textSecondary },
  auditNote: { fontFamily: Fonts.body, fontSize: 12, color: Colors.textMuted, marginTop: 2 },
});
