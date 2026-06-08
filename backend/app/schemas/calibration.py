from datetime import date
from typing import Optional

from pydantic import BaseModel, Field

class CalibrationCreate(BaseModel):
    calibration_date: date = Field(..., description="Date of calibration")
    next_due_date: date = Field(..., description="Next due date for calibration")
    result: Optional[str] = Field(None, max_length=80)
    performed_by: Optional[str] = Field(None, max_length=120)
    certificate_reference: Optional[str] = Field(None, max_length=160)
    notes: Optional[str] = Field(None)

class CalibrationRead(BaseModel):
    id: int
    calibration_date: date
    next_due_date: date
    result: Optional[str] = None
    performed_by: Optional[str] = None
    certificate_reference: Optional[str] = None
    notes: Optional[str] = None
