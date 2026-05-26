from fastapi.testclient import TestClient

from app.main import create_app


def test_health_endpoint_returns_ok() -> None:
    client = TestClient(create_app())

    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_version_endpoint_returns_version() -> None:
    client = TestClient(create_app())

    response = client.get("/api/version")

    assert response.status_code == 200
    assert "version" in response.json()
