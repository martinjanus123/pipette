from datetime import date
import csv
from typing import Annotated, Any, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Calibration, Pipette

router = APIRouter(prefix="/calibrations")
DbSession = Annotated[Session, Depends(get_db)]

@router.post("/import")
def import_calibrations(payload: dict, db: DbSession):
    """Import calibrations from CSV text.
    Expected JSON payload: {"csv_text": "..."}
    Returns: {"imported_count": int, "errors": List[dict]}
    """
    csv_text = payload.get("csv_text")
    if not isinstance(csv_text, str):
        raise HTTPException(status_code=422, detail="csv_text must be a string")

    errors: List[dict] = []
    imported = 0
    # Use csv.DictReader to parse header
    reader = csv.DictReader(csv_text.splitlines())
    required_fields = {"pipette_identifier", "calibration_date", "next_due_date"}
    for idx, row in enumerate(reader):
        row_number = idx + 2  # account for header line
        # Validate required fields presence
        for field in required_fields:
            if not row.get(field):
                errors.append({"row": row_number, "field": field, "message": f"{field} is required"})
        # If any required missing, skip further validation for this row
        if any(err["row"] == row_number for err in errors):
            continue
        # Resolve pipette by inventory_number or serial_number
        identifier = row["pipette_identifier"].strip()
        pipette = db.scalar(
            select(Pipette).where(
                or_(Pipette.inventory_number == identifier, Pipette.serial_number == identifier)
            )
        )
        if pipette is None:
            errors.append({"row": row_number, "field": "pipette_identifier", "message": "Pipette not found"})
            continue
        # Parse dates
        try:
            cal_date = date.fromisoformat(row["calibration_date"].strip())
        except Exception:
            errors.append({"row": row_number, "field": "calibration_date", "message": "Invalid date format"})
            continue
        try:
            next_date = date.fromisoformat(row["next_due_date"].strip())
        except Exception:
            errors.append({"row": row_number, "field": "next_due_date", "message": "Invalid date format"})
            continue
        # Optional fields
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
        imported += 1
    db.commit()
    return {"imported_count": imported, "errors": errors}
