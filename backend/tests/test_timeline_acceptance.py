from collections.abc import Generator
from datetime import date, datetime, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app import models
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
            "manufacturer": "HiddenTimeline",
            "model_name": "Combined",
            "inventory_number": "TIMELINE-1",
            "serial_number": "TIMELINE-SN-1",
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


def test_timeline_combines_events_and_calibrations_sorted_descending(
    client: TestClient, db_session: Session, pipette: dict
) -> None:
    db_session.add(
        models.Calibration(
            pipette_id=pipette["id"],
            calibration_date=date(2026, 5, 20),
            next_due_date=date(2027, 5, 20),
            result="passed",
            performed_by="Hidden Technician",
            certificate_reference="TIMELINE-CERT",
            notes="Timeline calibration note",
        )
    )
    db_session.add(
        models.PipetteEvent(
            pipette_id=pipette["id"],
            event_type="room_moved",
            event_date=datetime(2026, 6, 1, 12, 0, tzinfo=timezone.utc),
            old_value="Labor 1a",
            new_value="Labor 3",
            notes="Timeline move note",
            created_by="hidden-user",
        )
    )
    db_session.commit()

    response = client.get(f"/api/pipettes/{pipette['id']}/timeline")

    assert response.status_code == 200
    timeline = response.json()
    assert len(timeline) >= 2
    assert timeline[0]["type"] == "event"
    assert timeline[0]["source"] == "pipette_event"
    assert "Timeline move note" in timeline[0]["detail"]
    assert timeline[1]["type"] == "calibration"
    assert timeline[1]["source"] == "calibration"
    assert "TIMELINE-CERT" in timeline[1]["detail"]
    assert set(timeline[0]) >= {"type", "date", "title", "detail", "source"}


def test_timeline_for_unknown_pipette_returns_404(client: TestClient) -> None:
    response = client.get("/api/pipettes/999999/timeline")

    assert response.status_code == 404
