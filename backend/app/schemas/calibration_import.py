from pydantic import BaseModel, Field
from typing import List

class CalibrationImportRequest(BaseModel):
    csv_text: str = Field(..., description="CSV content as a single string")

class CalibrationImportError(BaseModel):
    row: int = Field(..., description="Line number in the CSV (including header)")
    field: str = Field(..., description="Name of the field with the error")
    message: str = Field(..., description="Human‑readable error message")

class CalibrationImportResponse(BaseModel):
    imported_count: int = Field(..., description="Number of successfully imported calibrations")
    errors: List[CalibrationImportError] = Field(default_factory=list)

    model_config = {"from_attributes": True}
