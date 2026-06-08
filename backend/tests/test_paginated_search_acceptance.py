from collections.abc import Generator

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


def _reference_ids(client: TestClient) -> dict[str, list[int]]:
    return {
        "rooms": [item["id"] for item in client.get("/api/rooms").json()],
        "applications": [item["id"] for item in client.get("/api/applications").json()],
        "uses": [item["id"] for item in client.get("/api/uses").json()],
        "pipette_types": [item["id"] for item in client.get("/api/pipette-types").json()],
    }


def _create(
    client: TestClient,
    db: Session,
    *,
    suffix: str,
    refs: dict[str, list[int]],
    room_index: int,
    application_index: int,
    use_index: int,
    type_index: int,
    status: str,
) -> dict:
    response = client.post(
        "/api/pipettes",
        json={
            "manufacturer": "HiddenSearch",
            "model_name": f"Paged {suffix}",
            "inventory_number": f"PAGE-{suffix}",
            "serial_number": f"PAGE-SN-{suffix}",
            "channel_count": 1,
            "use_id": refs["uses"][use_index],
            "pipette_type_id": refs["pipette_types"][type_index],
            "nominal_volume_ul": 100,
            "calibration_interval_months": 12,
            "application_id": refs["applications"][application_index],
            "room_id": refs["rooms"][room_index],
        },
    )
    assert response.status_code == 201
    created = response.json()
    pipette = db.get(models.Pipette, created["id"])
    assert pipette is not None
    pipette.status = status
    db.commit()
    return created


@pytest.fixture()
def search_dataset(client: TestClient, db_session: Session) -> dict:
    refs = _reference_ids(client)
    created = [
        _create(
            client,
            db_session,
            suffix="A",
            refs=refs,
            room_index=0,
            application_index=0,
            use_index=0,
            type_index=0,
            status="active",
        ),
        _create(
            client,
            db_session,
            suffix="B",
            refs=refs,
            room_index=0,
            application_index=1,
            use_index=1,
            type_index=1,
            status="maintenance",
        ),
        _create(
            client,
            db_session,
            suffix="C",
            refs=refs,
            room_index=1,
            application_index=0,
            use_index=0,
            type_index=0,
            status="retired",
        ),
    ]
    return {"refs": refs, "created": created}


def test_list_returns_paginated_envelope(client: TestClient, search_dataset: dict) -> None:
    response = client.get("/api/pipettes?limit=2&offset=1")

    assert response.status_code == 200
    body = response.json()
    assert set(body) >= {"items", "total", "limit", "offset"}
    assert body["limit"] == 2
    assert body["offset"] == 1
    assert body["total"] >= 3
    assert len(body["items"]) == 2


def test_combines_all_server_side_filters(client: TestClient, search_dataset: dict) -> None:
    refs = search_dataset["refs"]
    created = search_dataset["created"][0]

    response = client.get(
        "/api/pipettes"
        "?q=PAGE-A"
        f"&room_id={refs['rooms'][0]}"
        f"&application_id={refs['applications'][0]}"
        f"&use_id={refs['uses'][0]}"
        f"&pipette_type_id={refs['pipette_types'][0]}"
        "&status=active"
        "&limit=50&offset=0"
    )

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert [item["id"] for item in body["items"]] == [created["id"]]


def test_filters_do_not_override_each_other(client: TestClient, search_dataset: dict) -> None:
    refs = search_dataset["refs"]

    response = client.get(
        "/api/pipettes"
        "?q=PAGE-A"
        f"&room_id={refs['rooms'][1]}"
        "&status=active"
    )

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 0
    assert body["items"] == []
