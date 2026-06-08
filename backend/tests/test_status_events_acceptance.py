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


@pytest.fixture()
def pipette(client: TestClient) -> dict:
    refs = {
        "room_id": client.get("/api/rooms").json()[0]["id"],
        "application_id": client.get("/api/applications").json()[0]["id"],
        "use_id": client.get("/api/uses").json()[0]["id"],
        "pipette_type_id": client.get("/api/pipette-types").json()[0]["id"],
    }
    response = client.post(
        "/api/pipettes",
        json={
            "manufacturer": "HiddenStatus",
            "model_name": "Events",
            "inventory_number": "STATUS-EVENT-1",
            "serial_number": "STATUS-EVENT-SN-1",
            "channel_count": 1,
            "use_id": refs["use_id"],
            "pipette_type_id": refs["pipette_type_id"],
            "nominal_volume_ul": 100,
            "calibration_interval_months": 12,
            "application_id": refs["application_id"],
            "room_id": refs["room_id"],
        },
    )
    assert response.status_code == 201
    return response.json()


def test_status_change_updates_pipette_and_adds_event(client: TestClient, pipette: dict) -> None:
    response = client.patch(
        f"/api/pipettes/{pipette['id']}/status",
        json={
            "status": "maintenance",
            "notes": "Hidden maintenance note",
            "created_by": "hidden-user",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "maintenance"

    detail = client.get(f"/api/pipettes/{pipette['id']}").json()
    assert detail["status"] == "maintenance"
    event = next(item for item in detail["events"] if item["event_type"] == "status_changed")
    assert event["old_value"] == "active"
    assert event["new_value"] == "maintenance"
    assert event["notes"] == "Hidden maintenance note"
    assert event["created_by"] == "hidden-user"


def test_invalid_status_is_rejected_without_changing_pipette(
    client: TestClient, pipette: dict
) -> None:
    response = client.patch(
        f"/api/pipettes/{pipette['id']}/status",
        json={"status": "missing", "created_by": "hidden-user"},
    )

    assert response.status_code in {400, 422}
    assert client.get(f"/api/pipettes/{pipette['id']}").json()["status"] == "active"


def test_events_are_sorted_descending_after_multiple_status_changes(
    client: TestClient, pipette: dict
) -> None:
    for status in ["maintenance", "retired"]:
        response = client.patch(
            f"/api/pipettes/{pipette['id']}/status",
            json={"status": status, "created_by": "hidden-user"},
        )
        assert response.status_code == 200

    detail = client.get(f"/api/pipettes/{pipette['id']}").json()
    status_events = [event for event in detail["events"] if event["event_type"] == "status_changed"]

    assert [event["new_value"] for event in status_events[:2]] == ["retired", "maintenance"]
