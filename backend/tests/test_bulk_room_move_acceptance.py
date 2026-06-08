from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
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


def _refs(client: TestClient) -> dict[str, list[int]]:
    return {
        "rooms": [item["id"] for item in client.get("/api/rooms").json()],
        "room_names": [item["name"] for item in client.get("/api/rooms").json()],
        "applications": [item["id"] for item in client.get("/api/applications").json()],
        "uses": [item["id"] for item in client.get("/api/uses").json()],
        "pipette_types": [item["id"] for item in client.get("/api/pipette-types").json()],
    }


def _create(client: TestClient, refs: dict[str, list[int]], suffix: str, room_id: int) -> dict:
    response = client.post(
        "/api/pipettes",
        json={
            "manufacturer": "HiddenMove",
            "model_name": f"Bulk {suffix}",
            "inventory_number": f"MOVE-{suffix}",
            "serial_number": f"MOVE-SN-{suffix}",
            "channel_count": 1,
            "use_id": refs["uses"][0],
            "pipette_type_id": refs["pipette_types"][0],
            "nominal_volume_ul": 100,
            "calibration_interval_months": 12,
            "application_id": refs["applications"][0],
            "room_id": room_id,
        },
    )
    assert response.status_code == 201
    return response.json()


@pytest.fixture()
def move_dataset(client: TestClient) -> dict:
    refs = _refs(client)
    source_room_id = refs["rooms"][0]
    target_room_id = refs["rooms"][1]
    pipettes = [
        _create(client, refs, "A", source_room_id),
        _create(client, refs, "B", source_room_id),
    ]
    return {"refs": refs, "source_room_id": source_room_id, "target_room_id": target_room_id, "pipettes": pipettes}


def test_bulk_room_move_updates_all_pipettes_and_creates_events(
    client: TestClient, db_session: Session, move_dataset: dict
) -> None:
    pipette_ids = [item["id"] for item in move_dataset["pipettes"]]

    response = client.post(
        "/api/pipettes/bulk-room-move",
        json={
            "pipette_ids": pipette_ids,
            "target_room_id": move_dataset["target_room_id"],
            "notes": "Hidden move note",
            "created_by": "hidden-mover",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert set(body.get("moved_ids", pipette_ids)) == set(pipette_ids)
    for pipette_id in pipette_ids:
        pipette = db_session.get(models.Pipette, pipette_id)
        assert pipette is not None
        assert pipette.room_id == move_dataset["target_room_id"]

    events = db_session.scalars(
        select(models.PipetteEvent).where(models.PipetteEvent.pipette_id.in_(pipette_ids))
    ).all()
    move_events = [event for event in events if event.notes == "Hidden move note"]
    assert len(move_events) == 2
    source_values = {str(move_dataset["source_room_id"]), move_dataset["refs"]["room_names"][0]}
    target_values = {str(move_dataset["target_room_id"]), move_dataset["refs"]["room_names"][1]}
    assert {event.old_value for event in move_events} <= source_values
    assert {event.new_value for event in move_events} <= target_values
    assert {event.notes for event in move_events} == {"Hidden move note"}
    assert {event.created_by for event in move_events} == {"hidden-mover"}


def test_bulk_room_move_is_atomic_when_any_pipette_is_unknown(
    client: TestClient, db_session: Session, move_dataset: dict
) -> None:
    pipette_ids = [item["id"] for item in move_dataset["pipettes"]]

    response = client.post(
        "/api/pipettes/bulk-room-move",
        json={
            "pipette_ids": [pipette_ids[0], 999999],
            "target_room_id": move_dataset["target_room_id"],
            "notes": "Should not move",
            "created_by": "hidden-mover",
        },
    )

    assert response.status_code in {400, 404, 422}
    for pipette_id in pipette_ids:
        pipette = db_session.get(models.Pipette, pipette_id)
        assert pipette is not None
        assert pipette.room_id == move_dataset["source_room_id"]


def test_bulk_room_move_rejects_unknown_target_room(
    client: TestClient, db_session: Session, move_dataset: dict
) -> None:
    pipette_id = move_dataset["pipettes"][0]["id"]

    response = client.post(
        "/api/pipettes/bulk-room-move",
        json={
            "pipette_ids": [pipette_id],
            "target_room_id": 999999,
            "created_by": "hidden-mover",
        },
    )

    assert response.status_code in {400, 404, 422}
    assert db_session.get(models.Pipette, pipette_id).room_id == move_dataset["source_room_id"]
