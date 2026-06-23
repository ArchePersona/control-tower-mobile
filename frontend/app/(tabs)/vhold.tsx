import React, { useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Modal, TextInput,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts, Spacing, Radius, statusColor, statusBg, riskColor, strategyColor, trustColor } from "@/src/theme";
import { getVHoldSummary, getPendingProposals, submitDecision } from "@/src/services/api";

const FILTERS = ["all", "pending", "held", "escalated", "approved", "denied"];

export default function VHoldScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [summary, setSummary] = useState<any>(null);
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all");
  const [modalVisible, setModalVisible] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [operatorNote, setOperatorNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ ok: boolean; message: string } | null>(null);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [s, p] = await Promise.all([getVHoldSummary(), getPendingProposals(filter)]);
      setSummary(s);
      setProposals(p);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, [filter]));

  const openModal = (p: any) => { setSelected(p); setModalVisible(true); setConfirmAction(null); setOperatorNote(""); setSubmitResult(null); };
  const closeModal = () => { setModalVisible(false); setSelected(null); setConfirmAction(null); setOperatorNote(""); setSubmitResult(null); };

  const handleDecision = async () => {
    if (!selected || !confirmAction) return;
    setSubmitting(true);
    try {
      await submitDecision(selected.id, confirmAction, operatorNote);
      setSubmitResult({ ok: true, message: `Action ${confirmAction} successfully.` });
      setTimeout(() => { closeModal(); fetchData(); }, 1200);
    } catch (e: any) {
      setSubmitResult({ ok: false, message: e.message || "Failed" });
    } finally { setSubmitting(false); }
  };

  const timeAgo = (iso: string) => {
    if (!iso) return "";
    const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    return `${Math.floor(m / 60)}h ago`;
  };

  const statusTiming = (proposal: any) => {
    const t = timeAgo(proposal.created_at);
    switch (proposal.status) {
      case "pending": return `Waiting ${t}`;
      case "held": return `Held ${t}`;
      case "escalated": return `Escalated ${t}`;
      case "approved": return `Approved ${t}`;
      case "denied": return `Denied ${t}`;
      default: return t;
    }
  };

  const filteredCount = proposals.length;

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Sticky Header */}
      <View style={s.stickyHeader}>
        <View style={s.headerRow}>
          <View>
            <Text style={s.title} testID="vhold-title">V-HOLD</Text>
            <Text style={s.subtitle}>Action Authority</Text>
          </View>
          <View style={s.summaryBadges}>
            <View style={[s.badge, { backgroundColor: Colors.blueBg, borderColor: Colors.blueBorder }]}>
              <Text style={[s.badgeText, { color: Colors.blue }]}>{filter === "all" ? (summary?.pending || 0) + " pending" : filteredCount + " shown"}</Text>
            </View>
            {filter === "all" && (
              <View style={[s.badge, { backgroundColor: Colors.orangeBg, borderColor: Colors.orangeBorder }]}>
                <Text style={[s.badgeText, { color: Colors.orange }]}>{summary?.escalated || 0} esc</Text>
              </View>
            )}
          </View>
        </View>
        <Text style={s.headerNote}>Review proposed agent actions before they create consequences.</Text>

        {/* Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filtersRow} style={s.filtersScroll}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              testID={`filter-chip-${f}`}
              style={[s.chip, filter === f && s.chipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[s.chipText, filter === f && s.chipTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Proposals List */}
      <ScrollView
        style={s.list}
        contentContainerStyle={s.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={Colors.blue} />}
        showsVerticalScrollIndicator={false}
      >
        {loading && !proposals.length ? (
          <ActivityIndicator size="large" color={Colors.blue} style={{ marginTop: 40 }} />
        ) : proposals.length === 0 ? (
          <View style={s.emptyState}>
            <Ionicons name="checkmark-circle" size={48} color={Colors.green} />
            <Text style={s.emptyTitle}>No actions waiting</Text>
            <Text style={s.emptySubtitle}>CONTROL TOWER is clear.</Text>
          </View>
        ) : (
          proposals.map((p) => (
            <TouchableOpacity
              key={p.id}
              testID={`proposal-card-${p.id}`}
              style={s.proposalCard}
              onPress={() => openModal(p)}
              activeOpacity={0.85}
            >
              <View style={s.pcHeader}>
                <Text style={s.pcAgent}>{p.agent_name}</Text>
                <View style={[s.pcStatusBadge, { backgroundColor: statusBg(p.status) }]}>
                  <Text style={[s.pcStatusText, { color: statusColor(p.status) }]}>
                    {p.status?.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={s.pcAction}>{p.action_type}</Text>
              <View style={s.pcMetrics}>
                <Text style={[s.pcTag, { color: riskColor(p.risk_tier) }]}>Risk: {p.risk_tier}</Text>
                <Text style={[s.pcTag, { color: strategyColor(p.cost_boss_strategy) }]}>{p.cost_boss_strategy}</Text>
                <Text style={[s.pcTag, { color: trustColor(p.trust_level) }]}>{p.trust_level}</Text>
              </View>
              <Text style={s.pcReason} numberOfLines={2}>{p.reason}</Text>
              <View style={s.pcFooter}>
                <Text style={s.pcTime}>{statusTiming(p)}</Text>
                <Text style={s.pcReview}>Review →</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* HITL Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={closeModal}>
        <KeyboardAvoidingView style={s.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <TouchableOpacity style={s.modalBackdrop} onPress={closeModal} activeOpacity={1} />
          <View style={[s.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={s.modalHandle} />

            {submitResult ? (
              <View style={s.resultContainer}>
                <Ionicons
                  name={submitResult.ok ? "checkmark-circle" : "close-circle"}
                  size={48}
                  color={submitResult.ok ? Colors.green : Colors.red}
                />
                <Text style={[s.resultText, { color: submitResult.ok ? Colors.green : Colors.red }]}>
                  {submitResult.message}
                </Text>
              </View>
            ) : confirmAction ? (
              /* Confirmation Step */
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={s.confirmTitle}>
                  Confirm: {confirmAction.charAt(0).toUpperCase() + confirmAction.slice(1)}
                </Text>
                <Text style={s.confirmWarning}>
                  You are about to {confirmAction} this agent action.
                  {selected?.risk_tier === "high" || selected?.risk_tier === "critical"
                    ? "\nThis action may create external or business consequences."
                    : ""}
                </Text>
                <Text style={s.noteLabel}>Operator Note (optional)</Text>
                <TextInput
                  testID="operator-note-input"
                  style={s.noteInput}
                  value={operatorNote}
                  onChangeText={setOperatorNote}
                  placeholder="Add a note for the audit trail..."
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  numberOfLines={3}
                />
                <View style={s.confirmButtons}>
                  <TouchableOpacity
                    testID="confirm-decision-button"
                    style={[s.confirmBtn, { backgroundColor: statusColor(confirmAction) }]}
                    onPress={handleDecision}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <Text style={s.confirmBtnText}>Confirm {confirmAction}</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity testID="cancel-decision-button" style={s.cancelBtn} onPress={() => setConfirmAction(null)}>
                    <Text style={s.cancelBtnText}>Back</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            ) : selected ? (
              /* Review Content */
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={s.modalHeaderRow}>
                  <Text style={s.modalAgent}>{selected.agent_name}</Text>
                  <View style={[s.pcStatusBadge, { backgroundColor: statusBg(selected.status) }]}>
                    <Text style={[s.pcStatusText, { color: statusColor(selected.status) }]}>
                      {selected.status?.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={s.modalAction}>{selected.action_type}</Text>

                <View style={s.modalInfo}>
                  <View style={s.infoRow}><Text style={s.infoLabel}>Risk Tier</Text><Text style={[s.infoValue, { color: riskColor(selected.risk_tier) }]}>{selected.risk_tier}</Text></View>
                  <View style={s.infoRow}><Text style={s.infoLabel}>Strategy</Text><Text style={[s.infoValue, { color: strategyColor(selected.cost_boss_strategy) }]}>{selected.cost_boss_strategy}</Text></View>
                  <View style={s.infoRow}><Text style={s.infoLabel}>Trust Level</Text><Text style={[s.infoValue, { color: trustColor(selected.trust_level) }]}>{selected.trust_level}</Text></View>
                  <View style={s.infoRow}><Text style={s.infoLabel}>Waiting</Text><Text style={s.infoValue}>{timeAgo(selected.created_at)}</Text></View>
                  {selected.policy_hits?.length > 0 && (
                    <View style={s.infoRow}>
                      <Text style={s.infoLabel}>Policy Hits</Text>
                      <Text style={[s.infoValue, { color: Colors.red }]}>{selected.policy_hits.join(", ")}</Text>
                    </View>
                  )}
                </View>

                <Text style={s.modalReasonLabel}>Agent Reason</Text>
                <Text style={s.modalReason}>{selected.reason}</Text>

                {/* Action Buttons */}
                {(selected.status === "pending" || selected.status === "held" || selected.status === "escalated") && (
                  <View style={s.actionGrid}>
                    <TouchableOpacity testID="action-approve" style={[s.actionBtn, { backgroundColor: Colors.greenBg, borderColor: Colors.greenBorder }]} onPress={() => setConfirmAction("approved")}>
                      <Ionicons name="checkmark-circle" size={20} color={Colors.green} />
                      <Text style={[s.actionBtnText, { color: Colors.green }]}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity testID="action-deny" style={[s.actionBtn, { backgroundColor: Colors.redBg, borderColor: Colors.redBorder }]} onPress={() => setConfirmAction("denied")}>
                      <Ionicons name="close-circle" size={20} color={Colors.red} />
                      <Text style={[s.actionBtnText, { color: Colors.red }]}>Deny</Text>
                    </TouchableOpacity>
                    <TouchableOpacity testID="action-hold" style={[s.actionBtn, { backgroundColor: Colors.yellowBg, borderColor: Colors.yellowBorder }]} onPress={() => setConfirmAction("held")}>
                      <Ionicons name="pause-circle" size={20} color={Colors.yellow} />
                      <Text style={[s.actionBtnText, { color: Colors.yellow }]}>Hold</Text>
                    </TouchableOpacity>
                    <TouchableOpacity testID="action-escalate" style={[s.actionBtn, { backgroundColor: Colors.orangeBg, borderColor: Colors.orangeBorder }]} onPress={() => setConfirmAction("escalated")}>
                      <Ionicons name="arrow-up-circle" size={20} color={Colors.orange} />
                      <Text style={[s.actionBtnText, { color: Colors.orange }]}>Escalate</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Secondary Actions */}
                <View style={s.secondaryActions}>
                  <TouchableOpacity
                    testID="view-full-review-btn"
                    style={s.secondaryBtn}
                    onPress={() => { closeModal(); router.push(`/proposal/${selected.id}`); }}
                  >
                    <Text style={s.secondaryBtnText}>View Full Review</Text>
                    <Ionicons name="chevron-forward" size={16} color={Colors.blue} />
                  </TouchableOpacity>
                  <TouchableOpacity testID="close-modal-btn" style={s.secondaryBtn} onPress={closeModal}>
                    <Text style={s.secondaryBtnText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  stickyHeader: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, backgroundColor: Colors.bg, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: Spacing.sm },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  title: { fontFamily: Fonts.display, fontSize: 20, color: Colors.blue, letterSpacing: 2 },
  subtitle: { fontFamily: Fonts.body, fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  summaryBadges: { flexDirection: "row", gap: Spacing.xs },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.sm, borderWidth: 1 },
  badgeText: { fontFamily: Fonts.bodyBold, fontSize: 10, letterSpacing: 0.5, textTransform: "uppercase" },
  headerNote: { fontFamily: Fonts.body, fontSize: 12, color: Colors.textMuted, marginTop: Spacing.sm },
  filtersScroll: { maxHeight: 56 },
  filtersRow: { flexDirection: "row", gap: Spacing.sm, paddingTop: Spacing.sm, paddingHorizontal: 2 },
  chip: { height: 36, paddingHorizontal: 14, justifyContent: "center", borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, flexShrink: 0 },
  chipActive: { backgroundColor: Colors.blueBg, borderColor: Colors.blueBorder },
  chipText: { fontFamily: Fonts.bodySemiBold, fontSize: 12, color: Colors.textMuted },
  chipTextActive: { color: Colors.blue },
  list: { flex: 1 },
  listContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: 24 },
  emptyState: { alignItems: "center", paddingTop: 60 },
  emptyTitle: { fontFamily: Fonts.bodyBold, fontSize: 16, color: Colors.textPrimary, marginTop: Spacing.md },
  emptySubtitle: { fontFamily: Fonts.body, fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  proposalCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, marginBottom: Spacing.md },
  pcHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  pcAgent: { fontFamily: Fonts.bodyExtraBold, fontSize: 15, color: Colors.textPrimary, letterSpacing: 0.5 },
  pcStatusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.sm },
  pcStatusText: { fontFamily: Fonts.bodyBold, fontSize: 10, letterSpacing: 0.5 },
  pcAction: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.textSecondary, marginBottom: Spacing.sm },
  pcMetrics: { flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.sm, flexWrap: "wrap" },
  pcTag: { fontFamily: Fonts.bodySemiBold, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 },
  pcReason: { fontFamily: Fonts.body, fontSize: 13, color: Colors.textMuted, marginBottom: Spacing.sm },
  pcFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pcTime: { fontFamily: Fonts.body, fontSize: 11, color: Colors.textMuted },
  pcReview: { fontFamily: Fonts.bodySemiBold, fontSize: 12, color: Colors.blue },
  // Modal
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  modalSheet: { backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, maxHeight: "80%" },
  modalHandle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: "center", marginBottom: Spacing.lg },
  modalHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalAgent: { fontFamily: Fonts.bodyExtraBold, fontSize: 20, color: Colors.textPrimary, letterSpacing: 0.5 },
  modalAction: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.textSecondary, marginBottom: Spacing.md },
  modalInfo: { backgroundColor: Colors.surfaceRaised, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  infoLabel: { fontFamily: Fonts.body, fontSize: 13, color: Colors.textMuted },
  infoValue: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.textPrimary },
  modalReasonLabel: { fontFamily: Fonts.bodySemiBold, fontSize: 12, color: Colors.textMuted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4 },
  modalReason: { fontFamily: Fonts.body, fontSize: 14, color: Colors.textSecondary, marginBottom: Spacing.lg },
  actionGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm, marginBottom: Spacing.lg },
  actionBtn: { flex: 1, minWidth: "45%", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: Radius.md, borderWidth: 1 },
  actionBtnText: { fontFamily: Fonts.bodyBold, fontSize: 13 },
  secondaryActions: { gap: Spacing.sm, marginBottom: Spacing.md },
  secondaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 10 },
  secondaryBtnText: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.blue },
  // Confirm
  confirmTitle: { fontFamily: Fonts.bodyBold, fontSize: 18, color: Colors.textPrimary, marginBottom: Spacing.sm },
  confirmWarning: { fontFamily: Fonts.body, fontSize: 14, color: Colors.textSecondary, marginBottom: Spacing.lg },
  noteLabel: { fontFamily: Fonts.bodySemiBold, fontSize: 12, color: Colors.textMuted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4 },
  noteInput: { fontFamily: Fonts.body, fontSize: 14, color: Colors.textPrimary, backgroundColor: Colors.surfaceRaised, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, minHeight: 80, textAlignVertical: "top", marginBottom: Spacing.lg },
  confirmButtons: { gap: Spacing.sm, marginBottom: Spacing.md },
  confirmBtn: { paddingVertical: 14, borderRadius: Radius.md, alignItems: "center" },
  confirmBtnText: { fontFamily: Fonts.bodyBold, fontSize: 15, color: Colors.white },
  cancelBtn: { paddingVertical: 12, borderRadius: Radius.md, alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  cancelBtnText: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.textSecondary },
  resultContainer: { alignItems: "center", paddingVertical: 40 },
  resultText: { fontFamily: Fonts.bodyBold, fontSize: 16, marginTop: Spacing.md },
});
