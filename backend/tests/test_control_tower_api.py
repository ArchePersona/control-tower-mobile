"""
CONTROL TOWER Backend API Tests
Tests all endpoints: Auth, Dashboard, V-HOLD, Cost Boss, Policy, Agents, Audit
"""

import pytest
import requests
import os

# Get backend URL from environment
# Read from frontend .env if not in environment
BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL')
if not BASE_URL:
    # Try to read from frontend .env
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('EXPO_PUBLIC_BACKEND_URL='):
                    BASE_URL = line.split('=', 1)[1].strip()
                    break
    except:
        pass

if not BASE_URL:
    raise ValueError("EXPO_PUBLIC_BACKEND_URL not found in environment or /app/frontend/.env")

BASE_URL = BASE_URL.rstrip('/')

# Test credentials from test_credentials.md
TEST_EMAIL = "operator@archepersona.com"
TEST_PASSWORD = "ControlTower2026!"


class TestHealth:
    """Health check endpoint"""

    def test_health_endpoint(self):
        """Test /api/health returns 200 and correct structure"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Health check failed: {response.status_code}"
        
        data = response.json()
        assert "status" in data, "Missing 'status' in health response"
        assert data["status"] == "online", f"Expected status 'online', got {data['status']}"
        assert "system" in data, "Missing 'system' in health response"
        assert data["system"] == "CONTROL TOWER", f"Expected system 'CONTROL TOWER', got {data['system']}"
        print("✓ Health check passed")


class TestAuth:
    """Authentication endpoints"""

    def test_login_with_correct_credentials(self):
        """Test login with correct credentials returns tokens"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "access_token" in data, "Missing access_token in login response"
        assert "refresh_token" in data, "Missing refresh_token in login response"
        assert "token_type" in data, "Missing token_type in login response"
        assert data["token_type"] == "bearer", f"Expected token_type 'bearer', got {data['token_type']}"
        print("✓ Login with correct credentials passed")

    def test_login_with_wrong_password(self):
        """Test login with wrong password returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": "WrongPassword123!"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Login with wrong password correctly returns 401")

    def test_login_with_nonexistent_email(self):
        """Test login with non-existent email returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "nonexistent@example.com", "password": "SomePassword123!"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Login with non-existent email correctly returns 401")


@pytest.fixture
def auth_token():
    """Fixture to get valid auth token"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
    )
    if response.status_code != 200:
        pytest.skip("Cannot authenticate - login failed")
    data = response.json()
    return data["access_token"]


@pytest.fixture
def auth_headers(auth_token):
    """Fixture to get auth headers"""
    return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}


class TestAuthMe:
    """Test /api/auth/me endpoint"""

    def test_get_me_with_valid_token(self, auth_headers):
        """Test /api/auth/me returns user info"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=auth_headers)
        assert response.status_code == 200, f"Get me failed: {response.status_code}"
        
        data = response.json()
        assert "email" in data, "Missing email in /auth/me response"
        assert data["email"] == TEST_EMAIL, f"Expected email {TEST_EMAIL}, got {data['email']}"
        print("✓ Get me with valid token passed")


class TestDashboard:
    """Dashboard summary endpoint"""

    def test_dashboard_summary(self, auth_headers):
        """Test /api/dashboard/summary returns all layer data"""
        response = requests.get(f"{BASE_URL}/api/dashboard/summary", headers=auth_headers)
        assert response.status_code == 200, f"Dashboard summary failed: {response.status_code}"
        
        data = response.json()
        # Check all 4 layers are present
        assert "vhold" in data, "Missing vhold layer in dashboard"
        assert "cost_boss" in data, "Missing cost_boss layer in dashboard"
        assert "policy" in data, "Missing policy layer in dashboard"
        assert "trust_ladder" in data, "Missing trust_ladder layer in dashboard"
        
        # Check V-HOLD structure
        assert "pending" in data["vhold"], "Missing pending in vhold"
        assert "escalated" in data["vhold"], "Missing escalated in vhold"
        
        # Check status fields
        assert "status" in data, "Missing status in dashboard"
        assert "status_message" in data, "Missing status_message in dashboard"
        assert "alerts" in data, "Missing alerts in dashboard"
        assert "recent_decisions" in data, "Missing recent_decisions in dashboard"
        assert "system_health" in data, "Missing system_health in dashboard"
        
        print(f"✓ Dashboard summary passed - V-HOLD pending: {data['vhold']['pending']}, escalated: {data['vhold']['escalated']}")


class TestVHold:
    """V-HOLD endpoints"""

    def test_vhold_summary(self, auth_headers):
        """Test /api/vhold/summary returns summary data"""
        response = requests.get(f"{BASE_URL}/api/vhold/summary", headers=auth_headers)
        assert response.status_code == 200, f"V-HOLD summary failed: {response.status_code}"
        
        data = response.json()
        assert "pending" in data, "Missing pending in V-HOLD summary"
        assert "held" in data, "Missing held in V-HOLD summary"
        assert "escalated" in data, "Missing escalated in V-HOLD summary"
        print("✓ V-HOLD summary passed")

    def test_vhold_proposals_all(self, auth_headers):
        """Test /api/vhold/proposals returns proposals list"""
        response = requests.get(f"{BASE_URL}/api/vhold/proposals", headers=auth_headers)
        assert response.status_code == 200, f"V-HOLD proposals failed: {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Expected proposals to be a list"
        
        if len(data) > 0:
            proposal = data[0]
            assert "id" in proposal, "Missing id in proposal"
            assert "agent_name" in proposal, "Missing agent_name in proposal"
            assert "action_type" in proposal, "Missing action_type in proposal"
            assert "status" in proposal, "Missing status in proposal"
            assert "risk_tier" in proposal, "Missing risk_tier in proposal"
            print(f"✓ V-HOLD proposals passed - Found {len(data)} proposals")
        else:
            print("✓ V-HOLD proposals passed - No proposals found (empty list)")

    def test_vhold_proposals_filter_pending(self, auth_headers):
        """Test /api/vhold/proposals?status=pending returns only pending"""
        response = requests.get(f"{BASE_URL}/api/vhold/proposals?status=pending", headers=auth_headers)
        assert response.status_code == 200, f"V-HOLD proposals filter failed: {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Expected proposals to be a list"
        
        for proposal in data:
            assert proposal["status"] == "pending", f"Expected status 'pending', got {proposal['status']}"
        print(f"✓ V-HOLD proposals filter (pending) passed - Found {len(data)} pending proposals")

    def test_vhold_proposal_detail(self, auth_headers):
        """Test /api/vhold/proposals/{id} returns proposal detail"""
        # First get a proposal ID
        response = requests.get(f"{BASE_URL}/api/vhold/proposals", headers=auth_headers)
        proposals = response.json()
        
        if len(proposals) == 0:
            pytest.skip("No proposals available to test detail endpoint")
        
        proposal_id = proposals[0]["id"]
        response = requests.get(f"{BASE_URL}/api/vhold/proposals/{proposal_id}", headers=auth_headers)
        assert response.status_code == 200, f"V-HOLD proposal detail failed: {response.status_code}"
        
        data = response.json()
        assert "proposal" in data, "Missing proposal in detail response"
        assert "agent" in data, "Missing agent in detail response"
        assert "cost_boss" in data, "Missing cost_boss in detail response"
        assert "policy" in data, "Missing policy in detail response"
        print(f"✓ V-HOLD proposal detail passed for ID: {proposal_id}")

    def test_vhold_submit_decision_approve(self, auth_headers):
        """Test submitting an approval decision"""
        # Get a pending proposal
        response = requests.get(f"{BASE_URL}/api/vhold/proposals?status=pending", headers=auth_headers)
        proposals = response.json()
        
        if len(proposals) == 0:
            pytest.skip("No pending proposals available to test decision submission")
        
        proposal_id = proposals[0]["id"]
        
        # Submit approval decision
        response = requests.post(
            f"{BASE_URL}/api/vhold/proposals/{proposal_id}/decision",
            headers=auth_headers,
            json={"decision": "approved", "operator_note": "TEST: Automated test approval"}
        )
        assert response.status_code == 200, f"Decision submission failed: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "ok" in data, "Missing ok in decision response"
        assert data["ok"] == True, "Expected ok=True in decision response"
        assert "decision" in data, "Missing decision in response"
        assert data["decision"] == "approved", f"Expected decision 'approved', got {data['decision']}"
        
        # Verify the proposal status was updated
        verify_response = requests.get(f"{BASE_URL}/api/vhold/proposals/{proposal_id}", headers=auth_headers)
        verify_data = verify_response.json()
        assert verify_data["proposal"]["status"] == "approved", f"Proposal status not updated to 'approved', got {verify_data['proposal']['status']}"
        
        print(f"✓ V-HOLD decision submission (approve) passed for proposal {proposal_id}")


class TestCostBoss:
    """Cost Boss endpoints"""

    def test_cost_boss_summary(self, auth_headers):
        """Test /api/cost-boss/summary returns summary data"""
        response = requests.get(f"{BASE_URL}/api/cost-boss/summary", headers=auth_headers)
        assert response.status_code == 200, f"Cost Boss summary failed: {response.status_code}"
        
        data = response.json()
        assert "routes_today" in data, "Missing routes_today in Cost Boss summary"
        assert "top_strategy" in data, "Missing top_strategy in Cost Boss summary"
        assert "high_cost_routes" in data, "Missing high_cost_routes in Cost Boss summary"
        print("✓ Cost Boss summary passed")

    def test_cost_boss_strategies(self, auth_headers):
        """Test /api/cost-boss/strategies returns all 7 strategy modes"""
        response = requests.get(f"{BASE_URL}/api/cost-boss/strategies", headers=auth_headers)
        assert response.status_code == 200, f"Cost Boss strategies failed: {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Expected strategies to be a list"
        assert len(data) == 7, f"Expected 7 strategies, got {len(data)}"
        
        expected_modes = ["ECONOMY", "STANDARD", "REASONING", "RESEARCH", "PANEL", "AGGREGATE", "ESCALATE"]
        actual_modes = [s["mode"] for s in data]
        
        for mode in expected_modes:
            assert mode in actual_modes, f"Missing strategy mode: {mode}"
        
        # Check structure of first strategy
        strategy = data[0]
        assert "mode" in strategy, "Missing mode in strategy"
        assert "label" in strategy, "Missing label in strategy"
        assert "description" in strategy, "Missing description in strategy"
        assert "requires_vhold" in strategy, "Missing requires_vhold in strategy"
        
        print(f"✓ Cost Boss strategies passed - Found all 7 strategy modes")


class TestPolicy:
    """Policy endpoints"""

    def test_policy_summary(self, auth_headers):
        """Test /api/policy/summary returns summary data"""
        response = requests.get(f"{BASE_URL}/api/policy/summary", headers=auth_headers)
        assert response.status_code == 200, f"Policy summary failed: {response.status_code}"
        
        data = response.json()
        assert "denied_actions" in data, "Missing denied_actions in policy summary"
        assert "escalation_risks" in data, "Missing escalation_risks in policy summary"
        assert "policy_hits_count" in data, "Missing policy_hits_count in policy summary"
        assert "rules_count" in data, "Missing rules_count in policy summary"
        print("✓ Policy summary passed")

    def test_policy_rules(self, auth_headers):
        """Test /api/policy/rules returns policy rules"""
        response = requests.get(f"{BASE_URL}/api/policy/rules", headers=auth_headers)
        assert response.status_code == 200, f"Policy rules failed: {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Expected rules to be a list"
        assert len(data) > 0, "Expected at least one policy rule"
        
        # Check structure of first rule
        rule = data[0]
        assert "id" in rule, "Missing id in policy rule"
        assert "name" in rule, "Missing name in policy rule"
        assert "controls" in rule, "Missing controls in policy rule"
        assert "risk_level" in rule, "Missing risk_level in policy rule"
        
        print(f"✓ Policy rules passed - Found {len(data)} rules")


class TestAgents:
    """Agent / Trust Ladder endpoints"""

    def test_agents_list(self, auth_headers):
        """Test /api/agents returns agents list"""
        response = requests.get(f"{BASE_URL}/api/agents", headers=auth_headers)
        assert response.status_code == 200, f"Agents list failed: {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Expected agents to be a list"
        assert len(data) == 3, f"Expected 3 demo agents, got {len(data)}"
        
        # Check structure of first agent
        agent = data[0]
        assert "id" in agent, "Missing id in agent"
        assert "name" in agent, "Missing name in agent"
        assert "trust_score" in agent, "Missing trust_score in agent"
        assert "confidence_score" in agent, "Missing confidence_score in agent"
        assert "autonomy_level" in agent, "Missing autonomy_level in agent"
        
        # Verify demo agents exist
        agent_names = [a["name"] for a in data]
        assert "BRUNEL" in agent_names, "Missing demo agent BRUNEL"
        assert "PSYRENE" in agent_names, "Missing demo agent PSYRENE"
        assert "GALBUD" in agent_names, "Missing demo agent GALBUD"
        
        print(f"✓ Agents list passed - Found 3 demo agents: {', '.join(agent_names)}")

    def test_agent_detail(self, auth_headers):
        """Test /api/agents/{id} returns agent detail"""
        # First get an agent ID
        response = requests.get(f"{BASE_URL}/api/agents", headers=auth_headers)
        agents = response.json()
        
        if len(agents) == 0:
            pytest.skip("No agents available to test detail endpoint")
        
        agent_id = agents[0]["id"]
        response = requests.get(f"{BASE_URL}/api/agents/{agent_id}", headers=auth_headers)
        assert response.status_code == 200, f"Agent detail failed: {response.status_code}"
        
        data = response.json()
        assert "agent" in data, "Missing agent in detail response"
        assert "recent_proposals" in data, "Missing recent_proposals in detail response"
        assert "audit_history" in data, "Missing audit_history in detail response"
        assert "moves_up" in data, "Missing moves_up in detail response"
        assert "moves_down" in data, "Missing moves_down in detail response"
        assert "permission_envelope" in data, "Missing permission_envelope in detail response"
        
        print(f"✓ Agent detail passed for agent: {data['agent']['name']}")


class TestAudit:
    """Audit endpoints"""

    def test_audit_records(self, auth_headers):
        """Test /api/audit returns audit records"""
        response = requests.get(f"{BASE_URL}/api/audit", headers=auth_headers)
        assert response.status_code == 200, f"Audit records failed: {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Expected audit records to be a list"
        
        if len(data) > 0:
            record = data[0]
            assert "id" in record, "Missing id in audit record"
            assert "proposal_id" in record, "Missing proposal_id in audit record"
            assert "decision" in record, "Missing decision in audit record"
            assert "decided_by" in record, "Missing decided_by in audit record"
            print(f"✓ Audit records passed - Found {len(data)} records")
        else:
            print("✓ Audit records passed - No records found (empty list)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
