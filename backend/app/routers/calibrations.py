from datetime import date
import csv
import io
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Calibration, Pipette
from app.schemas.calibration_import import (
    CalibrationImportRequest,
    CalibrationImportResponse,
    CalibrationImportError,
)

router = APIRouter(prefix="/calibrations")

@router.post("/import", response_model=CalibrationImportResponse)
def import_calibrations(
    payload: CalibrationImportRequest,
    db: Session = Depends(get_db),
) -> CalibrationImportResponse:
    errors: List[CalibrationImportError] = []
    imported_count = 0

    f = io.StringIO(payload.csv_text)
    reader = csv.DictReader(f)
    required_fields = ["pipette_identifier", "calibration_date", "next_due_date"]
    for idx, row in enumerate(reader, start=2):  # start=2 because header is line 1
        # Check required fields presence
        missing = [field for field in required_fields if not row.get(field)]
        if missing:
            for field in missing:
                errors.append(
                    CalibrationImportError(
                        row=idx, field=field, message="Missing required field"
                    )
                )
            continue

        identifier = row["pipette_identifier"].strip()
        pipette = db.scalar(
            select(Pipette).where(
                or_(Pipette.inventory_number == identifier, Pipette.serial_number == identifier)
            )
        )
        if not pipette:
            errors.append(
                CalibrationImportError(
                    row=idx, field="pipette_identifier", message="Pipette not found"
                )
            )
            continue

        # Parse dates
        try:
            calibration_date = date.fromisoformat(row["calibration_date"].strip())
        except Exception:
            errors.append(
                CalibrationImportError(
                    row=idx, field="calibration_date", message="Invalid date format"
                )
            )
            continue
        try:
            next_due_date = date.fromisoformat(row["next_due_date"].strip())
        except Exception:
            errors.append(
                CalibrationImportError(
                    row=idx, field="next_due_date", message="Invalid date format"
                )
            )
            continue

        calibration = Calibration(
            pipette_id=pipette.id,
            calibration_date=calibration_date,
            next_due_date=next_due_date,
            result=row.get("result") or None,
            performed_by=row.get("performed_by") or None,
            certificate_reference=row.get("certificate_reference") or None,
            notes=row.get("notes") or None,
        )
        db.add(calibration)
        imported_count += 1

    # Commit all valid calibrations
    db.commit()
    return CalibrationImportResponse(imported_count=imported_count, errors=errors)
