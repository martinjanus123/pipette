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
def reference_ids(client: TestClient) -> dict[str, int]:
    return {
        "room_id": client.get("/api/rooms").json()[0]["id"],
        "application_id": client.get("/api/applications").json()[0]["id"],
        "use_id": client.get("/api/uses").json()[0]["id"],
        "pipette_type_id": client.get("/api/pipette-types").json()[0]["id"],
    }


def _payload(reference_ids: dict[str, int], *, inventory: str, serial: str) -> dict:
    return {
        "manufacturer": "HiddenTest",
        "model_name": "Duplicate Check",
        "inventory_number": inventory,
        "serial_number": serial,
        "channel_count": 1,
        "use_id": reference_ids["use_id"],
        "pipette_type_id": reference_ids["pipette_type_id"],
        "nominal_volume_ul": 100,
        "calibration_interval_months": 12,
        "application_id": reference_ids["application_id"],
        "room_id": reference_ids["room_id"],
    }


def test_duplicate_inventory_number_returns_field_specific_409(
    client: TestClient, reference_ids: dict[str, int]
) -> None:
    first = client.post(
        "/api/pipettes",
        json=_payload(reference_ids, inventory="DUP-INV", serial="SER-A"),
    )
    assert first.status_code == 201

    duplicate = client.post(
        "/api/pipettes",
        json=_payload(reference_ids, inventory="DUP-INV", serial="SER-B"),
    )

    assert duplicate.status_code == 409
    assert "inventory_number" in str(duplicate.json().get("detail", ""))


def test_duplicate_serial_number_returns_field_specific_409(
    client: TestClient, reference_ids: dict[str, int]
) -> None:
    first = client.post(
        "/api/pipettes",
        json=_payload(reference_ids, inventory="INV-A", serial="DUP-SER"),
    )
    assert first.status_code == 201

    duplicate = client.post(
        "/api/pipettes",
        json=_payload(reference_ids, inventory="INV-B", serial="DUP-SER"),
    )

    assert duplicate.status_code == 409
    assert "serial_number" in str(duplicate.json().get("detail", ""))


def test_valid_second_pipette_still_creates_after_conflict(
    client: TestClient, reference_ids: dict[str, int]
) -> None:
    first = client.post(
        "/api/pipettes",
        json=_payload(reference_ids, inventory="CONFLICT-INV", serial="CONFLICT-SER"),
    )
    assert first.status_code == 201

    conflict = client.post(
        "/api/pipettes",
        json=_payload(reference_ids, inventory="CONFLICT-INV", serial="OTHER-SER"),
    )
    assert conflict.status_code == 409

    valid = client.post(
        "/api/pipettes",
        json=_payload(reference_ids, inventory="VALID-INV", serial="VALID-SER"),
    )

    assert valid.status_code == 201
    assert valid.json()["inventory_number"] == "VALID-INV"
