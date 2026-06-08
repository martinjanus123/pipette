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
            "manufacturer": "HiddenCal",
            "model_name": "History",
            "inventory_number": "CAL-HIST-1",
            "serial_number": "CAL-HIST-SN-1",
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


def _post_calibration(client: TestClient, pipette_id: int, payload: dict) -> dict:
    response = client.post(f"/api/pipettes/{pipette_id}/calibrations", json=payload)
    assert response.status_code == 201
    return response.json()


def test_calibration_can_be_created_and_is_returned_in_detail_history(
    client: TestClient, pipette: dict
) -> None:
    created = _post_calibration(
        client,
        pipette["id"],
        {
            "calibration_date": "2026-05-20",
            "next_due_date": "2027-05-20",
            "result": "passed",
            "performed_by": "Hidden Technician",
            "certificate_reference": "CERT-HIDDEN-1",
            "notes": "Initial hidden calibration",
        },
    )

    detail = client.get(f"/api/pipettes/{pipette['id']}")

    assert created["result"] == "passed"
    assert detail.status_code == 200
    calibrations = detail.json()["calibrations"]
    assert len(calibrations) == 1
    assert calibrations[0]["calibration_date"] == "2026-05-20"
    assert calibrations[0]["next_due_date"] == "2027-05-20"
    assert calibrations[0]["performed_by"] == "Hidden Technician"
    assert calibrations[0]["certificate_reference"] == "CERT-HIDDEN-1"
    assert calibrations[0]["notes"] == "Initial hidden calibration"


def test_calibration_history_is_sorted_descending_by_calibration_date(
    client: TestClient, pipette: dict
) -> None:
    _post_calibration(
        client,
        pipette["id"],
        {
            "calibration_date": "2026-01-10",
            "next_due_date": "2027-01-10",
            "result": "passed",
        },
    )
    _post_calibration(
        client,
        pipette["id"],
        {
            "calibration_date": "2026-06-01",
            "next_due_date": "2027-06-01",
            "result": "failed",
        },
    )

    detail = client.get(f"/api/pipettes/{pipette['id']}").json()

    assert [item["calibration_date"] for item in detail["calibrations"]] == [
        "2026-06-01",
        "2026-01-10",
    ]


def test_calibration_for_unknown_pipette_returns_404(client: TestClient) -> None:
    response = client.post(
        "/api/pipettes/999999/calibrations",
        json={
            "calibration_date": "2026-05-20",
            "next_due_date": "2027-05-20",
            "result": "passed",
        },
    )

    assert response.status_code == 404
