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

    model_config = {"from_attributes": True}


class CalibrationDetail(BaseModel):
    id: int
    calibration_date: date
    next_due_date: date
    result: Optional[str]
    performed_by: Optional[str]
    certificate_reference: Optional[str]
    notes: Optional[str]

    model_config = {"from_attributes": True}
