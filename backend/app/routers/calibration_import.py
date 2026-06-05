from datetime import datetime
import csv
import io
from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Pipette, Calibration
from app.schemas.calibration_import import CalibrationImportRequest, CalibrationImportResult, CalibrationImportRow

router = APIRouter()
DbSession = Annotated[Session, Depends(get_db)]

@router.post("/calibrations/import", response_model=CalibrationImportResult)
def import_calibrations(payload: CalibrationImportRequest, db: DbSession) -> CalibrationImportResult:
    csv_file = io.StringIO(payload.csv_text)
    reader = csv.DictReader(csv_file)
    required_fields = {"pipette_identifier", "calibration_date", "next_due_date"}
    optional_fields = {"result", "performed_by", "certificate_reference", "notes"}
    line_number = 1  # header line
    errors: List[CalibrationImportRow] = []
    imported_count = 0
    for row in reader:
        line_number += 1
        # Validate required fields present
        for field in required_fields:
            if not row.get(field):
                errors.append(CalibrationImportRow(line=line_number, field=field, message="Missing required field"))
        if any(e.line == line_number for e in errors):
            continue
        identifier = row["pipette_identifier"].strip()
        pipette = (
            db.query(Pipette)
            .filter(
                (Pipette.inventory_number == identifier) | (Pipette.serial_number == identifier)
            )
            .first()
        )
        if not pipette:
            errors.append(CalibrationImportRow(line=line_number, field="pipette_identifier", message="Pipette not found"))
            continue
        # Parse dates
        try:
            cal_date = datetime.fromisoformat(row["calibration_date"]).date()
        except Exception:
            errors.append(CalibrationImportRow(line=line_number, field="calibration_date", message="Invalid date format"))
            continue
        try:
            next_date = datetime.fromisoformat(row["next_due_date"]).date()
        except Exception:
            errors.append(CalibrationImportRow(line=line_number, field="next_due_date", message="Invalid date format"))
            continue
        calibration = Calibration(
            pipette_id=pipette.id,
            calibration_date=cal_date,
            next_due_date=next_date,
            result=row.get("result") or None,
            performed_by=row.get("performed_by") or None,
            certificate_reference=row.get("certificate_reference") or None,
            notes=row.get("notes") or None,
        )
        db.add(calibration)
        try:
            db.flush()
        except Exception as exc:
            db.rollback()
            errors.append(CalibrationImportRow(line=line_number, field="database", message=str(exc)))
            continue
        imported_count += 1
    db.commit()
    return CalibrationImportResult(imported=imported_count, errors=errors)
