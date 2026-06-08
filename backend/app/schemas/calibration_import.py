from datetime import date
from typing import List

from pydantic import BaseModel, Field


class CalibrationImportRequest(BaseModel):
    csv_text: str = Field(..., min_length=1)


class CalibrationImportError(BaseModel):
    row: int
    field: str
    message: str


class CalibrationImportResponse(BaseModel):
    imported_count: int
    errors: List[CalibrationImportError] = Field(default_factory=list)
