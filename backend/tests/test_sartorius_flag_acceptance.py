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


def _create(client: TestClient, reference_ids: dict[str, int], volume: float, suffix: str) -> dict:
    response = client.post(
        "/api/pipettes",
        json={
            "manufacturer": "HiddenTest",
            "model_name": f"Sartorius {suffix}",
            "inventory_number": f"SART-{suffix}",
            "serial_number": f"SART-SN-{suffix}",
            "channel_count": 1,
            "use_id": reference_ids["use_id"],
            "pipette_type_id": reference_ids["pipette_type_id"],
            "nominal_volume_ul": volume,
            "calibration_interval_months": 12,
            "application_id": reference_ids["application_id"],
            "room_id": reference_ids["room_id"],
        },
    )
    assert response.status_code == 201
    return response.json()


def test_requires_sartorius_true_for_25_ul(
    client: TestClient, reference_ids: dict[str, int]
) -> None:
    created = _create(client, reference_ids, 25, "25")

    detail = client.get(f"/api/pipettes/{created['id']}").json()
    list_item = client.get("/api/pipettes?q=SART-25").json()[0]

    assert detail["requires_sartorius"] is True
    assert list_item["requires_sartorius"] is True


def test_requires_sartorius_true_below_25_ul(
    client: TestClient, reference_ids: dict[str, int]
) -> None:
    created = _create(client, reference_ids, 10, "10")

    detail = client.get(f"/api/pipettes/{created['id']}").json()

    assert detail["requires_sartorius"] is True


def test_requires_sartorius_false_above_25_ul(
    client: TestClient, reference_ids: dict[str, int]
) -> None:
    created = _create(client, reference_ids, 100, "100")

    detail = client.get(f"/api/pipettes/{created['id']}").json()
    list_item = client.get("/api/pipettes?q=SART-100").json()[0]

    assert detail["requires_sartorius"] is False
    assert list_item["requires_sartorius"] is False
