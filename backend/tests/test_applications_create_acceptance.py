from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app import models  # noqa: F401
from app.database import Base, get_db
from app.main import create_app
from app.seed import seed_reference_data


@pytest.fixture()
def db_session() -> Generator[Session, None, None]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    testing_session = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(bind=engine)
    db = testing_session()
    seed_reference_data(db)
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db_session: Session) -> Generator[TestClient, None, None]:
    app = create_app(initialize_database=False)

    def override_get_db() -> Generator[Session, None, None]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def _application_names(client: TestClient) -> list[str]:
    return [item["name"] for item in client.get("/api/applications").json()]


def test_new_application_can_be_created_and_listed(client: TestClient) -> None:
    response = client.post("/api/applications", json={"name": "Hidden Neue Anwendung"})

    assert response.status_code in {200, 201}
    body = response.json()
    assert body["name"] == "Hidden Neue Anwendung"
    assert body["is_active"] is True
    assert "Hidden Neue Anwendung" in _application_names(client)


def test_duplicate_application_does_not_create_second_row(client: TestClient) -> None:
    first = client.post("/api/applications", json={"name": "Hidden Duplicate App"})
    assert first.status_code in {200, 201}

    duplicate = client.post("/api/applications", json={"name": "Hidden Duplicate App"})
    assert duplicate.status_code in {200, 201, 409}

    names = _application_names(client)
    assert names.count("Hidden Duplicate App") == 1
