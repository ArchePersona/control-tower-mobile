/**
 * CONTROL TOWER API Client
 * ArchePersona Unified Service Layer
 */

import { storage } from "@/src/utils/storage";

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const API_BASE = `${BACKEND_URL}/api`;

const ACCESS_KEY = "ct_access_token";
const REFRESH_KEY = "ct_refresh_token";

// ── Token Management ─────────────────────────────────────────────────

export async function getAccessToken(): Promise<string | null> {
  return storage.secureGet(ACCESS_KEY, null) as Promise<string | null>;
}

export async function getRefreshToken(): Promise<string | null> {
  return storage.secureGet(REFRESH_KEY, null) as Promise<string | null>;
}

export async function storeTokens(access: string, refresh: string) {
  await storage.secureSet(ACCESS_KEY, access);
  await storage.secureSet(REFRESH_KEY, refresh);
}

export async function clearTokens() {
  await storage.secureRemove(ACCESS_KEY);
  await storage.secureRemove(REFRESH_KEY);
}

// ── Authenticated Fetch ──────────────────────────────────────────────

async function refreshSession(): Promise<string | null> {
  const rt = await getRefreshToken();
  if (!rt) return null;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: rt }),
    });
    if (!res.ok) {
      await clearTokens();
      return null;
    }
    const data = await res.json();
    await storeTokens(data.access_token, data.refresh_token);
    return data.access_token;
  } catch {
    await clearTokens();
    return null;
  }
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  let token = await getAccessToken();
  if (!token) {
    token = await refreshSession();
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let res = await fetch(`${API_BASE}${path}`, { ...init, headers });

  // If 401, try refresh once
  if (res.status === 401 && token) {
    const newToken = await refreshSession();
    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`;
      res = await fetch(`${API_BASE}${path}`, { ...init, headers });
    }
  }

  return res;
}

// ── Auth API ─────────────────────────────────────────────────────────

export async function loginAPI(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Login failed" }));
    throw new Error(err.detail || "Login failed");
  }
  const data = await res.json();
  await storeTokens(data.access_token, data.refresh_token);
  return data;
}

export async function logoutAPI() {
  try {
    await apiFetch("/auth/logout", { method: "POST" });
  } catch {}
  await clearTokens();
}

export async function getMeAPI() {
  const res = await apiFetch("/auth/me");
  if (!res.ok) return null;
  return res.json();
}

// ── Dashboard API ────────────────────────────────────────────────────

export async function getDashboardSummary() {
  const res = await apiFetch("/dashboard/summary");
  if (!res.ok) throw new Error("Failed to load dashboard");
  return res.json();
}

// ── V-HOLD API ───────────────────────────────────────────────────────

export async function getVHoldSummary() {
  const res = await apiFetch("/vhold/summary");
  if (!res.ok) throw new Error("Failed to load V-HOLD summary");
  return res.json();
}

export async function getPendingProposals(status?: string) {
  const q = status && status !== "all" ? `?status=${status}` : "";
  const res = await apiFetch(`/vhold/proposals${q}`);
  if (!res.ok) throw new Error("Failed to load proposals");
  return res.json();
}

export async function getProposalDetail(id: string) {
  const res = await apiFetch(`/vhold/proposals/${id}`);
  if (!res.ok) throw new Error("Failed to load proposal");
  return res.json();
}

export async function submitDecision(id: string, decision: string, operatorNote: string) {
  const res = await apiFetch(`/vhold/proposals/${id}/decision`, {
    method: "POST",
    body: JSON.stringify({ decision, operator_note: operatorNote }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Decision failed" }));
    throw new Error(err.detail || "Decision failed");
  }
  return res.json();
}

// ── Cost Boss API ────────────────────────────────────────────────────

export async function getCostBossSummary() {
  const res = await apiFetch("/cost-boss/summary");
  if (!res.ok) throw new Error("Failed to load Cost Boss");
  return res.json();
}

export async function getCostBossStrategies() {
  const res = await apiFetch("/cost-boss/strategies");
  if (!res.ok) throw new Error("Failed to load strategies");
  return res.json();
}

// ── Policy API ───────────────────────────────────────────────────────

export async function getPolicySummary() {
  const res = await apiFetch("/policy/summary");
  if (!res.ok) throw new Error("Failed to load policy");
  return res.json();
}

export async function getPolicyRules() {
  const res = await apiFetch("/policy/rules");
  if (!res.ok) throw new Error("Failed to load rules");
  return res.json();
}

// ── Agent / Trust Ladder API ─────────────────────────────────────────

export async function getAgents() {
  const res = await apiFetch("/agents");
  if (!res.ok) throw new Error("Failed to load agents");
  return res.json();
}

export async function getAgentDetail(id: string) {
  const res = await apiFetch(`/agents/${id}`);
  if (!res.ok) throw new Error("Failed to load agent");
  return res.json();
}

// ── Audit API ────────────────────────────────────────────────────────

export async function getAuditRecords(filters?: { decision?: string; agent?: string; risk?: string; action_type?: string }) {
  const params = new URLSearchParams();
  if (filters?.decision) params.set("decision", filters.decision);
  if (filters?.agent) params.set("agent", filters.agent);
  if (filters?.risk) params.set("risk", filters.risk);
  if (filters?.action_type) params.set("action_type", filters.action_type);
  const q = params.toString() ? `?${params.toString()}` : "";
  const res = await apiFetch(`/audit${q}`);
  if (!res.ok) throw new Error("Failed to load audit");
  return res.json();
}

export async function getAuditDetail(id: string) {
  const res = await apiFetch(`/audit/${id}`);
  if (!res.ok) throw new Error("Failed to load audit detail");
  return res.json();
}
