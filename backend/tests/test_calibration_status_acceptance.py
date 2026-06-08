from collections.abc import Generator
from datetime import date, timedelta

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
def reference_ids(client: TestClient) -> dict[str, int]:
    return {
        "room_id": client.get("/api/rooms").json()[0]["id"],
        "application_id": client.get("/api/applications").json()[0]["id"],
        "use_id": client.get("/api/uses").json()[0]["id"],
        "pipette_type_id": client.get("/api/pipette-types").json()[0]["id"],
    }


def _create_pipette(client: TestClient, refs: dict[str, int], suffix: str) -> dict:
    response = client.post(
        "/api/pipettes",
        json={
            "manufacturer": "HiddenStatus",
            "model_name": f"Status {suffix}",
            "inventory_number": f"CAL-STAT-{suffix}",
            "serial_number": f"CAL-STAT-SN-{suffix}",
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


def _add_calibration(
    db: Session,
    pipette_id: int,
    *,
    calibration_date: date,
    next_due_date: date,
) -> None:
    db.add(
        models.Calibration(
            pipette_id=pipette_id,
            calibration_date=calibration_date,
            next_due_date=next_due_date,
            result="passed",
            performed_by="Hidden Tester",
        )
    )
    db.commit()


def _list_item(client: TestClient, inventory_number: str) -> dict:
    response = client.get(f"/api/pipettes?q={inventory_number}")
    assert response.status_code == 200
    body = response.json()
    items = body["items"] if isinstance(body, dict) and "items" in body else body
    assert len(items) == 1
    return items[0]


def test_missing_calibration_is_gray_in_list_and_detail(
    client: TestClient, reference_ids: dict[str, int]
) -> None:
    created = _create_pipette(client, reference_ids, "GRAY")

    detail = client.get(f"/api/pipettes/{created['id']}")

    assert detail.status_code == 200
    assert detail.json()["calibration_status"] == "gray"
    assert _list_item(client, created["inventory_number"])["calibration_status"] == "gray"


def test_due_dates_map_to_red_yellow_and_green(
    client: TestClient, db_session: Session, reference_ids: dict[str, int]
) -> None:
    today = date.today()
    cases = {
        "RED": (today - timedelta(days=1), "red"),
        "YELLOW": (today + timedelta(days=30), "yellow"),
        "GREEN": (today + timedelta(days=31), "green"),
    }

    for suffix, (next_due_date, expected_status) in cases.items():
        created = _create_pipette(client, reference_ids, suffix)
        _add_calibration(
            db_session,
            created["id"],
            calibration_date=today - timedelta(days=10),
            next_due_date=next_due_date,
        )

        detail = client.get(f"/api/pipettes/{created['id']}").json()

        assert detail["calibration_status"] == expected_status
        assert _list_item(client, created["inventory_number"])["calibration_status"] == expected_status


def test_newest_calibration_drives_status(
    client: TestClient, db_session: Session, reference_ids: dict[str, int]
) -> None:
    today = date.today()
    created = _create_pipette(client, reference_ids, "LATEST")
    _add_calibration(
        db_session,
        created["id"],
        calibration_date=today - timedelta(days=40),
        next_due_date=today - timedelta(days=1),
    )
    _add_calibration(
        db_session,
        created["id"],
        calibration_date=today - timedelta(days=1),
        next_due_date=today + timedelta(days=90),
    )

    detail = client.get(f"/api/pipettes/{created['id']}").json()

    assert detail["calibration_status"] == "green"
