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


def _reference_ids(client: TestClient) -> dict[str, list[int]]:
    return {
        "rooms": [item["id"] for item in client.get("/api/rooms").json()],
        "applications": [item["id"] for item in client.get("/api/applications").json()],
        "uses": [item["id"] for item in client.get("/api/uses").json()],
        "pipette_types": [item["id"] for item in client.get("/api/pipette-types").json()],
    }


def _create_pipette(
    client: TestClient,
    *,
    suffix: str,
    room_id: int,
    application_id: int,
    use_id: int,
    pipette_type_id: int,
    serial_marker: str,
) -> dict:
    response = client.post(
        "/api/pipettes",
        json={
            "manufacturer": "HiddenTest",
            "model_name": f"FilterCheck {suffix}",
            "inventory_number": f"HID-{suffix}",
            "serial_number": f"SN-{serial_marker}-{suffix}",
            "channel_count": 1,
            "use_id": use_id,
            "pipette_type_id": pipette_type_id,
            "nominal_volume_ul": 100,
            "calibration_interval_months": 12,
            "application_id": application_id,
            "room_id": room_id,
        },
    )
    assert response.status_code == 201
    return response.json()


@pytest.fixture()
def filter_dataset(client: TestClient) -> dict:
    refs = _reference_ids(client)
    room_a, room_b = refs["rooms"][:2]
    app_a, app_b = refs["applications"][:2]
    use_id = refs["uses"][0]
    pipette_type_id = refs["pipette_types"][0]

    created = {
        "room_a_app_a": _create_pipette(
            client,
            suffix="A1",
            room_id=room_a,
            application_id=app_a,
            use_id=use_id,
            pipette_type_id=pipette_type_id,
            serial_marker="MATCH-ALPHA",
        ),
        "room_a_app_b": _create_pipette(
            client,
            suffix="A2",
            room_id=room_a,
            application_id=app_b,
            use_id=use_id,
            pipette_type_id=pipette_type_id,
            serial_marker="MATCH-BETA",
        ),
        "room_b_app_a": _create_pipette(
            client,
            suffix="B1",
            room_id=room_b,
            application_id=app_a,
            use_id=use_id,
            pipette_type_id=pipette_type_id,
            serial_marker="OTHER-ALPHA",
        ),
        "room_b_app_b": _create_pipette(
            client,
            suffix="B2",
            room_id=room_b,
            application_id=app_b,
            use_id=use_id,
            pipette_type_id=pipette_type_id,
            serial_marker="OTHER-BETA",
        ),
    }
    return {
        "room_a": room_a,
        "room_b": room_b,
        "app_a": app_a,
        "app_b": app_b,
        "created": created,
    }


def _ids(response) -> set[int]:
    assert response.status_code == 200
    return {item["id"] for item in response.json()}


def test_filters_by_room_id_only(client: TestClient, filter_dataset: dict) -> None:
    created = filter_dataset["created"]

    response = client.get(f"/api/pipettes?room_id={filter_dataset['room_a']}")

    assert _ids(response) == {
        created["room_a_app_a"]["id"],
        created["room_a_app_b"]["id"],
    }


def test_filters_by_application_id_only(client: TestClient, filter_dataset: dict) -> None:
    created = filter_dataset["created"]

    response = client.get(f"/api/pipettes?application_id={filter_dataset['app_a']}")

    assert _ids(response) == {
        created["room_a_app_a"]["id"],
        created["room_b_app_a"]["id"],
    }


def test_combines_room_and_application_filters_with_and(
    client: TestClient, filter_dataset: dict
) -> None:
    created = filter_dataset["created"]

    response = client.get(
        "/api/pipettes"
        f"?room_id={filter_dataset['room_a']}"
        f"&application_id={filter_dataset['app_a']}"
    )

    assert _ids(response) == {created["room_a_app_a"]["id"]}


def test_combines_q_with_room_and_application_filters(
    client: TestClient, filter_dataset: dict
) -> None:
    created = filter_dataset["created"]

    response = client.get(
        "/api/pipettes"
        "?q=MATCH-ALPHA"
        f"&room_id={filter_dataset['room_a']}"
        f"&application_id={filter_dataset['app_a']}"
    )

    assert _ids(response) == {created["room_a_app_a"]["id"]}


def test_q_filter_does_not_override_room_filter(client: TestClient, filter_dataset: dict) -> None:
    response = client.get(
        "/api/pipettes"
        "?q=MATCH-ALPHA"
        f"&room_id={filter_dataset['room_b']}"
    )

    assert response.status_code == 200
    assert response.json() == []


def test_q_filter_does_not_override_application_filter(
    client: TestClient, filter_dataset: dict
) -> None:
    response = client.get(
        "/api/pipettes"
        "?q=OTHER-BETA"
        f"&application_id={filter_dataset['app_a']}"
    )

    assert response.status_code == 200
    assert response.json() == []


def test_existing_q_search_still_works(client: TestClient, filter_dataset: dict) -> None:
    created = filter_dataset["created"]

    response = client.get("/api/pipettes?q=SN-MATCH-BETA")

    assert _ids(response) == {created["room_a_app_b"]["id"]}
