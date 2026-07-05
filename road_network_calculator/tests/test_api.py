from fastapi.testclient import TestClient

from app.main import app


def test_status_endpoint():
    client = TestClient(app)
    response = client.get("/api/network/status")
    assert response.status_code == 200
    assert response.json()["loaded"] is False

