import pytest

try:
    from fastapi.testclient import TestClient
except RuntimeError as exc:
    pytest.skip(str(exc), allow_module_level=True)

from app.main import app


def test_status_endpoint():
    client = TestClient(app)
    response = client.get("/api/network/status")
    assert response.status_code == 200
    assert response.json()["loaded"] is False
