from datetime import datetime
import csv
from io import StringIO
from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, or_, and_

from app.database import get_db
from app.models import Calibration, Pipette
from app.schemas.calibration_import import (
    CalibrationImportRequest,
    CalibrationImportResponse,
    CalibrationImportError,
)

router = APIRouter(prefix="/calibrations")
DbSession = Annotated[Session, Depends(get_db)]

def _parse_date(value: str, row_num: int, field_name: str, errors: List[CalibrationImportError]):
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except Exception:
        errors.append(CalibrationImportError(row=row_num, field=field_name, message="Invalid date format"))
        return None

@router.post("/import", response_model=CalibrationImportResponse)
def import_calibrations(payload: CalibrationImportRequest, db: DbSession) -> CalibrationImportResponse:
    csv_file = StringIO(payload.csv_text)
    reader = csv.DictReader(csv_file)
    required_fields = ["pipette_identifier", "calibration_date", "next_due_date"]
    imported = 0
    errors: List[CalibrationImportError] = []
    line_number = 1  # header line
    for row in reader:
        line_number += 1
        # Validate required fields presence
        for field in required_fields:
            if not row.get(field):
                errors.append(CalibrationImportError(row=line_number, field=field, message="Missing required field"))
        # If required fields missing, skip further processing for this row
        if any(err.row == line_number for err in errors):
            continue
        identifier = row["pipette_identifier"].strip()
        pipette = db.scalar(
            select(Pipette).where(
                or_(Pipette.inventory_number == identifier, Pipette.serial_number == identifier)
            )
        )
        if not pipette:
            errors.append(CalibrationImportError(row=line_number, field="pipette_identifier", message="Pipette nicht gefunden"))
            continue
        # Parse dates
        cal_date = _parse_date(row["calibration_date"].strip(), line_number, "calibration_date", errors)
        next_date = _parse_date(row["next_due_date"].strip(), line_number, "next_due_date", errors)
        if cal_date is None or next_date is None:
            continue
        # Optional fields
        result = row.get("result") or None
        performed_by = row.get("performed_by") or None
        certificate_reference = row.get("certificate_reference") or None
        notes = row.get("notes") or None
        # Create calibration record
        calibration = Calibration(
            pipette_id=pipette.id,
            calibration_date=cal_date,
            next_due_date=next_date,
            result=result,
            performed_by=performed_by,
            certificate_reference=certificate_reference,
            notes=notes,
        )
        db.add(calibration)
        imported += 1
    db.commit()
    return CalibrationImportResponse(imported_count=imported, errors=errors)
