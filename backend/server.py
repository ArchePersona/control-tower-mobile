"""
CONTROL TOWER API Server
ArchePersona — ARCHEngine Consequence Layer
Operational Alpha
"""

from fastapi import FastAPI, APIRouter, Depends, HTTPException, Query
from fastapi.security import OAuth2PasswordBearer
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from pathlib import Path
import os, logging, uuid, jwt, bcrypt, hashlib

# ── Config ────────────────────────────────────────────────────────────
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_REFRESH_SECRET = os.environ["JWT_REFRESH_SECRET"]
ACCESS_TTL = int(os.getenv("ACCESS_TOKEN_MINUTES", "30"))
REFRESH_TTL = int(os.getenv("REFRESH_TOKEN_DAYS", "30"))
ALGO = "HS256"

# ── Database ──────────────────────────────────────────────────────────
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# ── App ───────────────────────────────────────────────────────────────
app = FastAPI(title="CONTROL TOWER API", version="0.1.0-alpha")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

# ── Auth Helpers ──────────────────────────────────────────────────────
oauth2 = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def utcnow():
    return datetime.now(timezone.utc)

def hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

def verify_pw(pw: str, hashed: str) -> bool:
    return bcrypt.checkpw(pw.encode(), hashed.encode())

def hash_tok(t: str) -> str:
    return hashlib.sha256(t.encode()).hexdigest()

def make_jwt(payload: dict, secret: str, ttl: timedelta) -> str:
    return jwt.encode({**payload, "exp": utcnow() + ttl}, secret, algorithm=ALGO)

async def get_current_user(token: str = Depends(oauth2)):
    try:
        p = jwt.decode(token, JWT_SECRET, algorithms=[ALGO])
        if p.get("typ") != "access":
            raise HTTPException(401, "Invalid token type")
        email = p.get("sub")
        if not email:
            raise HTTPException(401, "Missing subject")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Could not validate credentials", headers={"WWW-Authenticate": "Bearer"})
    user = await db.users.find_one({"email": email}, {"_id": 0, "password_hash": 0, "refresh_token_hash": 0})
    if not user:
        raise HTTPException(401, "User not found")
    return user

# ── Auth Models ───────────────────────────────────────────────────────
class LoginReq(BaseModel):
    email: str
    password: str

class RefreshReq(BaseModel):
    refresh_token: str

class DecisionReq(BaseModel):
    decision: str  # approved, denied, held, escalated
    operator_note: Optional[str] = ""

# ── Auth Routes ───────────────────────────────────────────────────────
@api.post("/auth/login")
async def login(body: LoginReq):
    user = await db.users.find_one({"email": body.email.lower()})
    if not user or not verify_pw(body.password, user["password_hash"]):
        raise HTTPException(401, "Incorrect email or password")
    access = make_jwt({"sub": user["email"], "typ": "access"}, JWT_SECRET, timedelta(minutes=ACCESS_TTL))
    refresh = make_jwt({"sub": user["email"], "typ": "refresh"}, JWT_REFRESH_SECRET, timedelta(days=REFRESH_TTL))
    await db.users.update_one({"email": user["email"]}, {"$set": {"refresh_token_hash": hash_tok(refresh)}})
    return {"access_token": access, "refresh_token": refresh, "token_type": "bearer"}

@api.post("/auth/refresh")
async def refresh_token(body: RefreshReq):
    try:
        p = jwt.decode(body.refresh_token, JWT_REFRESH_SECRET, algorithms=[ALGO])
        if p.get("typ") != "refresh":
            raise HTTPException(401, "Invalid token type")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid refresh token")
    user = await db.users.find_one({"email": p.get("sub")})
    if not user or user.get("refresh_token_hash") != hash_tok(body.refresh_token):
        raise HTTPException(401, "Refresh token revoked")
    access = make_jwt({"sub": user["email"], "typ": "access"}, JWT_SECRET, timedelta(minutes=ACCESS_TTL))
    new_refresh = make_jwt({"sub": user["email"], "typ": "refresh"}, JWT_REFRESH_SECRET, timedelta(days=REFRESH_TTL))
    await db.users.update_one({"email": user["email"]}, {"$set": {"refresh_token_hash": hash_tok(new_refresh)}})
    return {"access_token": access, "refresh_token": new_refresh, "token_type": "bearer"}

@api.post("/auth/logout")
async def logout(user=Depends(get_current_user)):
    await db.users.update_one({"email": user["email"]}, {"$set": {"refresh_token_hash": None}})
    return {"ok": True}

@api.get("/auth/me")
async def get_me(user=Depends(get_current_user)):
    return {"id": user.get("id", ""), "email": user["email"], "name": user.get("name", "")}

# ── Dashboard ─────────────────────────────────────────────────────────
@api.get("/dashboard/summary")
async def dashboard_summary(user=Depends(get_current_user)):
    proposals = await db.proposals.find({}, {"_id": 0}).to_list(200)
    agents = await db.agents.find({}, {"_id": 0}).to_list(100)
    audit = await db.audit_records.find({}, {"_id": 0}).sort("decided_at", -1).to_list(5)

    pending = sum(1 for p in proposals if p["status"] == "pending")
    held = sum(1 for p in proposals if p["status"] == "held")
    escalated = sum(1 for p in proposals if p["status"] == "escalated")
    denied = sum(1 for p in proposals if p["status"] == "denied")
    approved = sum(1 for p in proposals if p["status"] == "approved")
    high_cost = sum(1 for p in proposals if p.get("cost_boss_strategy") in ["PANEL", "AGGREGATE", "ESCALATE"] and p["status"] in ["pending", "escalated"])

    # Status message
    waiting = pending + held
    if waiting > 0 or escalated > 0:
        parts = []
        if waiting > 0:
            parts.append(f"{waiting} action{'s' if waiting != 1 else ''} waiting")
        if escalated > 0:
            parts.append(f"{escalated} escalation{'s' if escalated != 1 else ''} active")
        status_message = " · ".join(parts)
    else:
        status_message = "All systems clear"

    # Alerts
    alerts = []
    if escalated > 0:
        alerts.append({"type": "escalation", "message": f"{escalated} escalated V-HOLD action{'s' if escalated != 1 else ''}", "layer": "vhold"})
    if high_cost > 0:
        alerts.append({"type": "cost", "message": f"{high_cost} high-cost route{'s' if high_cost != 1 else ''} need{'s' if high_cost == 1 else ''} authority", "layer": "cost"})
    if denied > 0:
        alerts.append({"type": "policy", "message": f"{denied} policy block{'s' if denied != 1 else ''} today", "layer": "policy"})

    # Top strategy
    strats = {}
    for p in proposals:
        s = p.get("cost_boss_strategy", "STANDARD")
        strats[s] = strats.get(s, 0) + 1
    top_strategy = max(strats, key=strats.get) if strats else "STANDARD"

    # Agent counts
    supervised = sum(1 for a in agents if a["autonomy_level"] == "supervised")
    trusted = sum(1 for a in agents if a["autonomy_level"] == "trusted")
    restricted = sum(1 for a in agents if a["autonomy_level"] == "restricted")
    operational = sum(1 for a in agents if a["autonomy_level"] == "operational")
    expanded = sum(1 for a in agents if a["autonomy_level"] == "expanded")

    last_decision = audit[0]["decision"].capitalize() if audit else None

    return {
        "status": "Operational Alpha",
        "status_message": status_message,
        "last_updated": utcnow().isoformat(),
        "vhold": {"pending": pending, "held": held, "escalated": escalated, "denied": denied, "approved": approved, "last_decision": last_decision},
        "cost_boss": {"top_strategy": top_strategy, "routes_today": len(proposals), "high_cost_routes": high_cost, "authority_required": sum(1 for p in proposals if p.get("requires_vhold_authority") and p["status"] in ["pending", "escalated"])},
        "policy": {"denied_actions": denied, "escalation_risks": escalated, "policy_hits": sum(len(p.get("policy_hits", [])) for p in proposals), "blocked_today": denied},
        "trust_ladder": {"active_agents": len(agents), "supervised": supervised, "trusted": trusted, "restricted": restricted, "operational": operational, "expanded": expanded},
        "alerts": alerts,
        "recent_decisions": audit,
        "system_health": {"api_health": "online", "deployment_status": "alpha", "last_sync": utcnow().isoformat(), "session_status": "active"}
    }

# ── V-HOLD Routes ────────────────────────────────────────────────────
@api.get("/vhold/summary")
async def vhold_summary(user=Depends(get_current_user)):
    proposals = await db.proposals.find({}, {"_id": 0}).to_list(200)
    audit = await db.audit_records.find({}, {"_id": 0}).sort("decided_at", -1).to_list(1)
    return {
        "pending": sum(1 for p in proposals if p["status"] == "pending"),
        "held": sum(1 for p in proposals if p["status"] == "held"),
        "escalated": sum(1 for p in proposals if p["status"] == "escalated"),
        "denied_today": sum(1 for p in proposals if p["status"] == "denied"),
        "approved_today": sum(1 for p in proposals if p["status"] == "approved"),
        "last_decision": audit[0] if audit else None,
    }

@api.get("/vhold/proposals")
async def get_proposals(status: Optional[str] = Query(None), user=Depends(get_current_user)):
    query = {}
    if status and status != "all":
        query["status"] = status
    proposals = await db.proposals.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    return proposals

@api.get("/vhold/proposals/{proposal_id}")
async def get_proposal(proposal_id: str, user=Depends(get_current_user)):
    proposal = await db.proposals.find_one({"id": proposal_id}, {"_id": 0})
    if not proposal:
        raise HTTPException(404, "Proposal not found")
    agent = await db.agents.find_one({"id": proposal["agent_id"]}, {"_id": 0})
    cost_decision = await db.cost_boss_decisions.find_one({"proposal_id": proposal_id}, {"_id": 0})
    policy_result = await db.policy_results.find_one({"proposal_id": proposal_id}, {"_id": 0})
    audit_records = await db.audit_records.find({"proposal_id": proposal_id}, {"_id": 0}).sort("decided_at", -1).to_list(20)
    return {
        "proposal": proposal,
        "agent": agent,
        "cost_boss": cost_decision,
        "policy": policy_result,
        "audit_records": audit_records,
    }

@api.post("/vhold/proposals/{proposal_id}/decision")
async def submit_decision(proposal_id: str, body: DecisionReq, user=Depends(get_current_user)):
    if body.decision not in ["approved", "denied", "held", "escalated"]:
        raise HTTPException(400, "Invalid decision. Must be: approved, denied, held, escalated")
    proposal = await db.proposals.find_one({"id": proposal_id}, {"_id": 0})
    if not proposal:
        raise HTTPException(404, "Proposal not found")
    if proposal["status"] in ["approved", "denied"]:
        raise HTTPException(400, "Proposal already resolved")

    now = utcnow()
    await db.proposals.update_one({"id": proposal_id}, {"$set": {"status": body.decision, "decided_at": now.isoformat()}})

    audit_record = {
        "id": f"audit_{uuid.uuid4().hex[:8]}",
        "proposal_id": proposal_id,
        "agent_name": proposal["agent_name"],
        "action_type": proposal["action_type"],
        "decision": body.decision,
        "operator_note": body.operator_note or "",
        "decided_by": user["email"],
        "decided_at": now.isoformat(),
        "risk_tier": proposal.get("risk_tier", "medium"),
        "cost_boss_strategy": proposal.get("cost_boss_strategy", "STANDARD"),
        "trust_level_at_decision": proposal.get("trust_level", "supervised"),
        "policy_hits": proposal.get("policy_hits", []),
    }
    await db.audit_records.insert_one(audit_record)

    # Update agent stats
    agent_id = proposal["agent_id"]
    update_field = f"{body.decision}_count"
    await db.agents.update_one({"id": agent_id}, {"$inc": {update_field: 1}, "$set": {"last_activity": now.isoformat()}})

    # If denied or escalated, potentially adjust trust
    if body.decision == "denied":
        agent = await db.agents.find_one({"id": agent_id})
        if agent and agent.get("trust_score", 50) > 10:
            await db.agents.update_one({"id": agent_id}, {"$inc": {"trust_score": -5, "confidence_score": -3}})
    elif body.decision == "approved":
        await db.agents.update_one({"id": agent_id}, {"$inc": {"trust_score": 2, "confidence_score": 1}})

    return {"ok": True, "decision": body.decision, "audit_id": audit_record["id"]}

# ── Cost Boss Routes ──────────────────────────────────────────────────
@api.get("/cost-boss/summary")
async def cost_boss_summary(user=Depends(get_current_user)):
    proposals = await db.proposals.find({}, {"_id": 0}).to_list(200)
    decisions = await db.cost_boss_decisions.find({}, {"_id": 0}).to_list(200)

    strats = {}
    for p in proposals:
        s = p.get("cost_boss_strategy", "STANDARD")
        strats[s] = strats.get(s, 0) + 1
    top = max(strats, key=strats.get) if strats else "STANDARD"

    high_cost = [d for d in decisions if d.get("estimated_cost_tier") in ["high", "critical"]]
    need_auth = [d for d in decisions if d.get("requires_vhold_authority")]

    return {
        "routes_today": len(proposals),
        "top_strategy": top,
        "strategy_breakdown": strats,
        "high_cost_routes": len(high_cost),
        "authority_required": len(need_auth),
        "escalated_spend": sum(1 for d in decisions if d.get("authority_status") == "escalated"),
        "decisions": decisions,
    }

@api.get("/cost-boss/strategies")
async def cost_boss_strategies(user=Depends(get_current_user)):
    strategies = [
        {"mode": "ECONOMY", "label": "Economy", "description": "Lowest viable model route for safe, routine, reversible work.", "requires_vhold": False, "color": "green"},
        {"mode": "STANDARD", "label": "Standard", "description": "Balanced default route for normal business work.", "requires_vhold": False, "color": "blue"},
        {"mode": "REASONING", "label": "Reasoning", "description": "Stronger model route for complex judgment, planning, or multi-step decisions.", "requires_vhold": False, "color": "blue"},
        {"mode": "RESEARCH", "label": "Research", "description": "Research-capable workflow for current, external, or source-backed information.", "requires_vhold": True, "color": "purple"},
        {"mode": "PANEL", "label": "Panel", "description": "Multiple independent model outputs for uncertain or high-consequence work.", "requires_vhold": True, "color": "purple"},
        {"mode": "AGGREGATE", "label": "Aggregate", "description": "Synthesis route for multiple existing model/research outputs.", "requires_vhold": True, "color": "orange"},
        {"mode": "ESCALATE", "label": "Escalate", "description": "Operator approval required before expensive, unusual, or risky route.", "requires_vhold": True, "color": "red"},
    ]
    # Add usage counts from proposals
    proposals = await db.proposals.find({}, {"_id": 0}).to_list(200)
    for s in strategies:
        s["usage_count"] = sum(1 for p in proposals if p.get("cost_boss_strategy") == s["mode"])
        s["recent_uses"] = [{"agent": p["agent_name"], "action": p["action_type"], "status": p["status"]} for p in proposals if p.get("cost_boss_strategy") == s["mode"]][:3]
    return strategies

# ── Policy Routes ─────────────────────────────────────────────────────
@api.get("/policy/summary")
async def policy_summary(user=Depends(get_current_user)):
    proposals = await db.proposals.find({}, {"_id": 0}).to_list(200)
    rules = await db.policy_rules.find({}, {"_id": 0}).to_list(100)

    denied = [p for p in proposals if p["status"] == "denied"]
    escalated = [p for p in proposals if p["status"] == "escalated"]
    all_hits = []
    for p in proposals:
        all_hits.extend(p.get("policy_hits", []))

    return {
        "denied_actions": len(denied),
        "escalation_risks": len(escalated),
        "policy_hits_count": len(all_hits),
        "blocked_today": len(denied),
        "recent_blocked": [{"agent": p["agent_name"], "action": p["action_type"], "reason": p.get("reason", "")} for p in denied[:5]],
        "recent_escalated": [{"agent": p["agent_name"], "action": p["action_type"], "reason": p.get("reason", "")} for p in escalated[:5]],
        "rules_count": len(rules),
    }

@api.get("/policy/rules")
async def get_policy_rules(user=Depends(get_current_user)):
    rules = await db.policy_rules.find({}, {"_id": 0}).to_list(100)
    return rules

# ── Agent / Trust Ladder Routes ───────────────────────────────────────
@api.get("/agents")
async def get_agents(user=Depends(get_current_user)):
    agents = await db.agents.find({}, {"_id": 0}).to_list(100)
    return agents

@api.get("/agents/{agent_id}")
async def get_agent(agent_id: str, user=Depends(get_current_user)):
    agent = await db.agents.find_one({"id": agent_id}, {"_id": 0})
    if not agent:
        raise HTTPException(404, "Agent not found")
    proposals = await db.proposals.find({"agent_id": agent_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    audit = await db.audit_records.find({"agent_name": agent["name"]}, {"_id": 0}).sort("decided_at", -1).to_list(20)

    # Determine what moves agent up/down
    level = agent.get("autonomy_level", "supervised")
    moves_up = "Consistent approvals, low denial rate, and high confidence score."
    moves_down = "Repeated denials, escalations, or policy violations."
    if level == "restricted":
        moves_up = "Complete 5 approved actions without denial to move to Supervised."
    elif level == "supervised":
        moves_up = "Maintain 80%+ approval rate over 20 actions to reach Operational."
    elif level == "operational":
        moves_up = "Achieve trust score > 85 with zero recent escalations to reach Expanded."
    elif level == "expanded":
        moves_up = "Sustained high confidence (>90) and trust (>90) to reach Trusted."

    return {
        "agent": agent,
        "recent_proposals": proposals[:10],
        "audit_history": audit[:10],
        "moves_up": moves_up,
        "moves_down": moves_down,
        "permission_envelope": _get_permission_envelope(level),
    }

def _get_permission_envelope(level: str) -> dict:
    envelopes = {
        "restricted": {"can_send_email": False, "can_spend_money": False, "can_call_external_api": False, "can_delete_data": False, "auto_approve": False},
        "supervised": {"can_send_email": "requires_review", "can_spend_money": False, "can_call_external_api": "requires_review", "can_delete_data": False, "auto_approve": False},
        "operational": {"can_send_email": True, "can_spend_money": "requires_review", "can_call_external_api": True, "can_delete_data": False, "auto_approve": False},
        "expanded": {"can_send_email": True, "can_spend_money": "requires_review", "can_call_external_api": True, "can_delete_data": "requires_review", "auto_approve": "low_risk_only"},
        "trusted": {"can_send_email": True, "can_spend_money": True, "can_call_external_api": True, "can_delete_data": "requires_review", "auto_approve": "standard_risk"},
    }
    return envelopes.get(level, envelopes["restricted"])

# ── Audit Routes ──────────────────────────────────────────────────────
@api.get("/audit")
async def get_audit(
    decision: Optional[str] = None,
    agent: Optional[str] = None,
    risk: Optional[str] = None,
    action_type: Optional[str] = None,
    user=Depends(get_current_user)
):
    query = {}
    if decision:
        query["decision"] = decision
    if agent:
        query["agent_name"] = {"$regex": agent, "$options": "i"}
    if risk:
        query["risk_tier"] = risk
    if action_type:
        query["action_type"] = action_type
    records = await db.audit_records.find(query, {"_id": 0}).sort("decided_at", -1).to_list(200)
    return records

@api.get("/audit/{audit_id}")
async def get_audit_detail(audit_id: str, user=Depends(get_current_user)):
    record = await db.audit_records.find_one({"id": audit_id}, {"_id": 0})
    if not record:
        raise HTTPException(404, "Audit record not found")
    proposal = await db.proposals.find_one({"id": record.get("proposal_id")}, {"_id": 0})
    return {"audit": record, "proposal": proposal}

# ── Health ────────────────────────────────────────────────────────────
@api.get("/health")
async def health():
    return {"status": "online", "version": "0.1.0-alpha", "system": "CONTROL TOWER", "timestamp": utcnow().isoformat()}

# ── Include Router + CORS ─────────────────────────────────────────────
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Seed Data ─────────────────────────────────────────────────────────
async def seed_data():
    existing = await db.users.find_one({"email": "operator@archepersona.com"})
    if existing:
        logger.info("Seed data already exists, skipping.")
        return

    logger.info("Seeding demo data...")
    now = utcnow()

    # Operator user
    await db.users.insert_one({
        "id": "user_001",
        "email": "operator@archepersona.com",
        "name": "Tower Operator",
        "password_hash": hash_pw("ControlTower2026!"),
        "role": "operator",
        "refresh_token_hash": None,
    })

    # Agents
    agents = [
        {"id": "agent_001", "name": "BRUNEL", "status": "active", "trust_score": 72, "confidence_score": 81, "autonomy_level": "supervised", "oversight_state": "active", "approved_count": 18, "denied_count": 2, "held_count": 1, "escalated_count": 3, "last_activity": (now - timedelta(minutes=5)).isoformat()},
        {"id": "agent_002", "name": "PSYRENE", "status": "active", "trust_score": 35, "confidence_score": 42, "autonomy_level": "restricted", "oversight_state": "active", "approved_count": 4, "denied_count": 5, "held_count": 2, "escalated_count": 6, "last_activity": (now - timedelta(minutes=12)).isoformat()},
        {"id": "agent_003", "name": "GALBUD", "status": "active", "trust_score": 85, "confidence_score": 88, "autonomy_level": "operational", "oversight_state": "active", "approved_count": 32, "denied_count": 1, "held_count": 0, "escalated_count": 1, "last_activity": (now - timedelta(hours=1)).isoformat()},
    ]
    await db.agents.insert_many(agents)

    # Proposals
    proposals = [
        {"id": "proposal_001", "agent_id": "agent_001", "agent_name": "BRUNEL", "action_type": "SEND_EMAIL", "risk_tier": "medium", "status": "pending", "reason": "Send follow-up email to a customer after support resolution.", "created_at": (now - timedelta(minutes=8)).isoformat(), "cost_boss_strategy": "STANDARD", "policy_hits": [], "requires_vhold_authority": True, "trust_level": "supervised", "target_system": "Email Service", "target_entity": "customer_4521@example.com", "requested_outcome": "Deliver support follow-up email"},
        {"id": "proposal_002", "agent_id": "agent_002", "agent_name": "PSYRENE", "action_type": "SPEND_MONEY", "risk_tier": "high", "status": "escalated", "reason": "Purchase premium research dataset for market analysis.", "created_at": (now - timedelta(minutes=15)).isoformat(), "cost_boss_strategy": "ESCALATE", "policy_hits": ["spend_money", "external_api"], "requires_vhold_authority": True, "trust_level": "restricted", "target_system": "Payment Gateway", "target_entity": "vendor_research_co", "requested_outcome": "Process $2,400 payment for dataset access"},
        {"id": "proposal_003", "agent_id": "agent_001", "agent_name": "BRUNEL", "action_type": "RESEARCH_VENDOR", "risk_tier": "medium", "status": "pending", "reason": "Compare three SaaS vendors for team collaboration tools.", "created_at": (now - timedelta(minutes=22)).isoformat(), "cost_boss_strategy": "PANEL", "policy_hits": ["external_api"], "requires_vhold_authority": True, "trust_level": "supervised", "target_system": "Research Engine", "target_entity": "vendor_comparison_q4", "requested_outcome": "Generate vendor comparison report"},
        {"id": "proposal_004", "agent_id": "agent_003", "agent_name": "GALBUD", "action_type": "DELETE_DATA", "risk_tier": "critical", "status": "denied", "reason": "Remove outdated customer records from archive.", "created_at": (now - timedelta(hours=2)).isoformat(), "cost_boss_strategy": "STANDARD", "policy_hits": ["delete_data", "pii_handling"], "requires_vhold_authority": True, "trust_level": "operational", "target_system": "Data Archive", "target_entity": "customer_records_2023", "requested_outcome": "Permanent deletion of 847 archived records"},
        {"id": "proposal_005", "agent_id": "agent_003", "agent_name": "GALBUD", "action_type": "SUMMARIZE_REPORT", "risk_tier": "low", "status": "approved", "reason": "Summarize quarterly revenue report for executive team.", "created_at": (now - timedelta(hours=3)).isoformat(), "cost_boss_strategy": "ECONOMY", "policy_hits": [], "requires_vhold_authority": False, "trust_level": "operational", "target_system": "Report Engine", "target_entity": "q3_revenue_report", "requested_outcome": "Generate executive summary"},
        {"id": "proposal_006", "agent_id": "agent_001", "agent_name": "BRUNEL", "action_type": "CALL_EXTERNAL_API", "risk_tier": "medium", "status": "pending", "reason": "Fetch latest pricing data from supplier API.", "created_at": (now - timedelta(minutes=4)).isoformat(), "cost_boss_strategy": "STANDARD", "policy_hits": ["external_api"], "requires_vhold_authority": True, "trust_level": "supervised", "target_system": "Supplier API", "target_entity": "pricing_endpoint_v2", "requested_outcome": "Retrieve current pricing catalog"},
    ]
    await db.proposals.insert_many(proposals)

    # Cost Boss Decisions
    cost_decisions = [
        {"id": "cbd_001", "proposal_id": "proposal_001", "strategy": "STANDARD", "reason": "Standard business communication, balanced route appropriate.", "estimated_cost_tier": "low", "requires_vhold_authority": True, "budget_envelope": "standard_comms", "authority_status": "pending_review"},
        {"id": "cbd_002", "proposal_id": "proposal_002", "strategy": "ESCALATE", "reason": "High dollar amount and restricted agent require operator approval.", "estimated_cost_tier": "high", "requires_vhold_authority": True, "budget_envelope": "research_panel_allowed", "authority_status": "escalated"},
        {"id": "cbd_003", "proposal_id": "proposal_003", "strategy": "PANEL", "reason": "High uncertainty and meaningful business consequence require model comparison.", "estimated_cost_tier": "high", "requires_vhold_authority": True, "budget_envelope": "research_panel_allowed", "authority_status": "pending_review"},
        {"id": "cbd_004", "proposal_id": "proposal_004", "strategy": "STANDARD", "reason": "Routine data operation, standard route.", "estimated_cost_tier": "low", "requires_vhold_authority": True, "budget_envelope": "standard_ops", "authority_status": "denied"},
        {"id": "cbd_005", "proposal_id": "proposal_005", "strategy": "ECONOMY", "reason": "Low-risk summarization task, economy route sufficient.", "estimated_cost_tier": "low", "requires_vhold_authority": False, "budget_envelope": "economy_allowed", "authority_status": "auto_approved"},
        {"id": "cbd_006", "proposal_id": "proposal_006", "strategy": "STANDARD", "reason": "Standard external API call, balanced route.", "estimated_cost_tier": "low", "requires_vhold_authority": True, "budget_envelope": "standard_comms", "authority_status": "pending_review"},
    ]
    await db.cost_boss_decisions.insert_many(cost_decisions)

    # Policy Results
    policy_results = [
        {"id": "pr_001", "proposal_id": "proposal_001", "denied_actions": [], "escalation_risks": [], "policy_hits": [], "permission_envelope": {"can_send_email": "requires_review"}, "explanation": "Email sending requires human review at supervised trust level."},
        {"id": "pr_002", "proposal_id": "proposal_002", "denied_actions": ["SPEND_MONEY"], "escalation_risks": ["high"], "policy_hits": ["spend_money", "external_api"], "permission_envelope": {"can_spend_money": False}, "explanation": "Spending is blocked for restricted agents. Escalation required."},
        {"id": "pr_003", "proposal_id": "proposal_003", "denied_actions": [], "escalation_risks": ["medium"], "policy_hits": ["external_api"], "permission_envelope": {"can_call_external_api": "requires_review"}, "explanation": "External API calls require review. Panel strategy adds cost consideration."},
        {"id": "pr_004", "proposal_id": "proposal_004", "denied_actions": ["DELETE_DATA"], "escalation_risks": ["critical"], "policy_hits": ["delete_data", "pii_handling"], "permission_envelope": {"can_delete_data": False}, "explanation": "Data deletion blocked. PII handling policy triggered. Critical risk."},
        {"id": "pr_005", "proposal_id": "proposal_005", "denied_actions": [], "escalation_risks": [], "policy_hits": [], "permission_envelope": {"can_summarize": True}, "explanation": "Low-risk report summarization. No policy restrictions."},
        {"id": "pr_006", "proposal_id": "proposal_006", "denied_actions": [], "escalation_risks": [], "policy_hits": ["external_api"], "permission_envelope": {"can_call_external_api": "requires_review"}, "explanation": "External API access requires review at supervised trust level."},
    ]
    await db.policy_results.insert_many(policy_results)

    # Policy Rules
    policy_rules = [
        {"id": "rule_001", "name": "SPEND_MONEY", "controls": "Agent financial transactions", "why_matters": "Prevents unauthorized spending and protects business budgets.", "trigger_action": "Triggered actions require V-HOLD authority unless already allowed by policy and Trust Ladder level.", "risk_level": "high", "affected_actions": ["SPEND_MONEY", "PURCHASE", "SUBSCRIBE"]},
        {"id": "rule_002", "name": "DELETE_DATA", "controls": "Permanent data removal operations", "why_matters": "Prevents irreversible data loss and ensures compliance with retention policies.", "trigger_action": "All delete operations require V-HOLD authority regardless of trust level. Critical risk flagged for PII.", "risk_level": "critical", "affected_actions": ["DELETE_DATA", "PURGE_RECORDS", "ARCHIVE_REMOVE"]},
        {"id": "rule_003", "name": "EXTERNAL_API", "controls": "Outbound API calls to third-party services", "why_matters": "Controls data exposure and service dependency risks.", "trigger_action": "Requires review for supervised and restricted agents. Operational+ agents may auto-execute low-risk calls.", "risk_level": "medium", "affected_actions": ["CALL_EXTERNAL_API", "RESEARCH_VENDOR", "FETCH_DATA"]},
        {"id": "rule_004", "name": "SEND_COMMUNICATIONS", "controls": "Outbound emails, messages, and notifications", "why_matters": "Prevents unauthorized communication on behalf of the organization.", "trigger_action": "Supervised agents require review. Operational+ agents can send pre-approved templates.", "risk_level": "medium", "affected_actions": ["SEND_EMAIL", "SEND_NOTIFICATION", "POST_MESSAGE"]},
        {"id": "rule_005", "name": "PII_HANDLING", "controls": "Access and processing of personally identifiable information", "why_matters": "Ensures compliance with data protection regulations.", "trigger_action": "Any action touching PII fields triggers enhanced logging and may require escalation.", "risk_level": "high", "affected_actions": ["ACCESS_PII", "PROCESS_PII", "EXPORT_PII"]},
        {"id": "rule_006", "name": "HIGH_COST_ROUTE", "controls": "Expensive model routing and research operations", "why_matters": "Prevents unnecessary spend on costly AI operations.", "trigger_action": "PANEL, AGGREGATE, and ESCALATE routes always require V-HOLD authority.", "risk_level": "high", "affected_actions": ["PANEL_ROUTE", "AGGREGATE_ROUTE", "RESEARCH_ROUTE"]},
    ]
    await db.policy_rules.insert_many(policy_rules)

    # Audit Records
    audit_records = [
        {"id": "audit_001", "proposal_id": "proposal_005", "agent_name": "GALBUD", "action_type": "SUMMARIZE_REPORT", "decision": "approved", "operator_note": "Low-risk summary task. Auto-approved via economy route.", "decided_by": "system", "decided_at": (now - timedelta(hours=3)).isoformat(), "risk_tier": "low", "cost_boss_strategy": "ECONOMY", "trust_level_at_decision": "operational", "policy_hits": []},
        {"id": "audit_002", "proposal_id": "proposal_004", "agent_name": "GALBUD", "action_type": "DELETE_DATA", "decision": "denied", "operator_note": "Data deletion blocked. PII records require manual review and retention compliance check.", "decided_by": "operator@archepersona.com", "decided_at": (now - timedelta(hours=2)).isoformat(), "risk_tier": "critical", "cost_boss_strategy": "STANDARD", "trust_level_at_decision": "operational", "policy_hits": ["delete_data", "pii_handling"]},
        {"id": "audit_003", "proposal_id": "proposal_002", "agent_name": "PSYRENE", "action_type": "SPEND_MONEY", "decision": "escalated", "operator_note": "High-value purchase from restricted agent. Requires senior review.", "decided_by": "operator@archepersona.com", "decided_at": (now - timedelta(minutes=12)).isoformat(), "risk_tier": "high", "cost_boss_strategy": "ESCALATE", "trust_level_at_decision": "restricted", "policy_hits": ["spend_money", "external_api"]},
    ]
    await db.audit_records.insert_many(audit_records)

    logger.info("Seed data complete.")

@app.on_event("startup")
async def startup():
    await seed_data()

@app.on_event("shutdown")
async def shutdown():
    client.close()
