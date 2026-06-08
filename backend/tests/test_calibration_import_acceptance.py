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


def _create(client: TestClient, suffix: str) -> dict:
    refs = {
        "room_id": client.get("/api/rooms").json()[0]["id"],
        "application_id": client.get("/api/applications").json()[0]["id"],
        "use_id": client.get("/api/uses").json()[0]["id"],
        "pipette_type_id": client.get("/api/pipette-types").json()[0]["id"],
    }
    response = client.post(
        "/api/pipettes",
        json={
            "manufacturer": "HiddenImport",
            "model_name": f"CSV {suffix}",
            "inventory_number": f"IMPORT-{suffix}",
            "serial_number": f"IMPORT-SN-{suffix}",
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


def test_csv_import_creates_calibrations_by_inventory_or_serial_number(
    client: TestClient, db_session: Session
) -> None:
    first = _create(client, "INV")
    second = _create(client, "SER")
    csv_text = "\n".join(
        [
            "pipette_identifier,calibration_date,next_due_date,result,performed_by,certificate_reference,notes",
            f"{first['inventory_number']},2026-05-20,2027-05-20,passed,Hidden Tech,CERT-INV,Inventory match",
            f"{second['serial_number']},2026-06-01,2027-06-01,failed,Hidden Tech,CERT-SER,Serial match",
        ]
    )

    response = client.post("/api/calibrations/import", json={"csv_text": csv_text})

    assert response.status_code == 200
    body = response.json()
    assert body["imported_count"] == 2
    assert body.get("errors", []) == []

    calibrations = db_session.scalars(select(models.Calibration)).all()
    assert len(calibrations) == 2
    assert {item.certificate_reference for item in calibrations} == {"CERT-INV", "CERT-SER"}


def test_csv_import_reports_structured_row_errors(client: TestClient, db_session: Session) -> None:
    created = _create(client, "ERRORS")
    csv_text = "\n".join(
        [
            "pipette_identifier,calibration_date,next_due_date,result,performed_by,certificate_reference,notes",
            f"{created['inventory_number']},2026-05-20,2027-05-20,passed,Hidden Tech,CERT-OK,Valid",
            "UNKNOWN-PIPE,2026-05-21,2027-05-21,passed,Hidden Tech,CERT-BAD,Unknown",
            f"{created['serial_number']},not-a-date,2027-05-22,passed,Hidden Tech,CERT-DATE,Bad date",
        ]
    )

    response = client.post("/api/calibrations/import", json={"csv_text": csv_text})

    assert response.status_code in {200, 207, 422}
    body = response.json()
    errors = body["errors"]
    assert any(error["row"] == 3 and error["field"] == "pipette_identifier" for error in errors)
    assert any(error["row"] == 4 and error["field"] == "calibration_date" for error in errors)
    assert all(error.get("message") for error in errors)
    assert db_session.scalar(select(models.Calibration).where(models.Calibration.certificate_reference == "CERT-OK"))
