from datetime import date
from typing import List, Optional

from pydantic import BaseModel, Field, validator

class CalibrationImportRow(BaseModel):
    line: int
    field: str
    message: str

class CalibrationImportResult(BaseModel):
    imported: int = Field(..., description="Number of successfully imported calibrations")
    errors: List[CalibrationImportRow] = Field(default_factory=list)

class CalibrationImportRequest(BaseModel):
    csv_text: str = Field(..., description="CSV content with header line")
