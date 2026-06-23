# CONTROL TOWER — Product Requirements Document

## Product Identity
- **Product Name:** CONTROL TOWER
- **Company:** ArchePersona
- **Parent System:** ARCHEngine
- **Core Thesis:** Character + Consequence = Trust.
- **Definition:** CONTROL TOWER is ARCHEngine's consequence layer for autonomous AI agents.

## Version
- **Alpha Build:** Operational Alpha v0.1.0

## Architecture

### Four Intervention Layers
1. **V-HOLD** — Action Authority: controls approval queue, pending/held/escalated actions, HITL review
2. **COST BOSS** — Spend Strategy: 7 modes (ECONOMY, STANDARD, REASONING, RESEARCH, PANEL, AGGREGATE, ESCALATE)
3. **POLICY PRIMER** — Rule Guidance: denied actions, escalation risks, permission envelopes
4. **TRUST LADDER** — Autonomy Progression: 5 rungs (restricted → supervised → operational → expanded → trusted)

### Backend
- **Framework:** FastAPI
- **Database:** MongoDB (local)
- **Auth:** JWT email/password (bcrypt hashing, access/refresh token rotation)
- **API Prefix:** /api
- **Collections:** users, agents, proposals, cost_boss_decisions, policy_results, policy_rules, audit_records
- **Demo Data:** 3 agents (BRUNEL, PSYRENE, GALBUD), 6 proposals, 6 policy rules, 3 audit records

### Frontend
- **Framework:** Expo SDK 54, React Native, Expo Router (file-based routing)
- **Design:** Dark command-center aesthetic
- **Fonts:** Audiowide (display), Manrope (body/interface)
- **Navigation:** 5-tab bottom bar (Tower, V-HOLD, Cost, Policy, Agents)

### Auth
- Unified ArchePersona auth abstraction (not app-specific)
- JWT access token (30min TTL) + refresh token (30 day TTL)
- Secure token storage via expo-secure-store (native) / AsyncStorage (web)
- Protected routes with auth guard in root layout

## Screens
1. **Login** — ArchePersona branded dark login
2. **Tower Dashboard** — Tappable 4-layer summary with alerts, recent decisions, system health
3. **V-HOLD** — Approval queue with filter chips, HITL review modal, confirmation flow
4. **COST BOSS** — 7 strategy modes with usage counts and expandable details
5. **POLICY PRIMER** — Policy rules, denied/escalated action summaries
6. **TRUST LADDER (Agents)** — Agent cards with trust/confidence scores, ladder visualization, detail modal
7. **Proposal Detail** — Full V-HOLD review with 7 sections, decision controls, audit trail
8. **Audit** — Filterable decision records with operator notes

## API Endpoints
- `POST /api/auth/login` — Login
- `POST /api/auth/refresh` — Token refresh
- `POST /api/auth/logout` — Logout
- `GET /api/auth/me` — Current user
- `GET /api/dashboard/summary` — Dashboard data
- `GET /api/vhold/proposals` — Proposals list (filterable)
- `GET /api/vhold/proposals/:id` — Proposal detail with agent, cost, policy info
- `POST /api/vhold/proposals/:id/decision` — Submit decision
- `GET /api/cost-boss/summary` — Cost strategy overview
- `GET /api/cost-boss/strategies` — All 7 strategy modes
- `GET /api/policy/summary` — Policy overview
- `GET /api/policy/rules` — Policy rules
- `GET /api/agents` — Agent list
- `GET /api/agents/:id` — Agent detail with permission envelope
- `GET /api/audit` — Audit records (filterable)
- `GET /api/health` — Health check

## Test Credentials
- Email: operator@archepersona.com
- Password: ControlTower2026!
