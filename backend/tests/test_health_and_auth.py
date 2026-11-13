import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.config import settings

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert "mode" in data
    assert "llm" in data
    assert "supabase" in data
    assert "ffmpeg" in data

def test_auth_missing_header():
    # If not in demo mode, missing header returns 401
    settings.DEMO_MODE = False
    response = client.get("/api/episodes")
    assert response.status_code == 401
    err = response.json()
    assert "error" in err
    assert err["error"]["code"] == "UNAUTHORIZED"

def test_auth_fake_token():
    settings.DEMO_MODE = False
    response = client.get("/api/episodes", headers={"Authorization": "Bearer fake_token_xyz"})
    assert response.status_code in (401, 503) # 401 unauthorized or 503 if client unconfigured
    err = response.json()
    assert "error" in err

def test_auth_demo_mode():
    settings.DEMO_MODE = True
    response = client.get("/api/episodes")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
