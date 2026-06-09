from typing import Literal, List

from pydantic import BaseModel, Field


class CalibrationCreate(BaseModel):
    calibration_date: str = Field(..., description="Date of the calibration in ISO format")
    next_due_date: str = Field(..., description="Next due date in ISO format")
    result: str | None = Field(None, max_length=80)
    performed_by: str | None = Field(None, max_length=120)
    certificate_reference: str | None = Field(None, max_length=160)
    notes: str | None = Field(None)


class CalibrationRead(BaseModel):
    id: int
    calibration_date: str
    next_due_date: str
    result: str | None = None
    performed_by: str | None = None
    certificate_reference: str | None = None
    notes: str | None = None


class PipetteCreate(BaseModel):
    manufacturer: str = Field(min_length=1, max_length=120)
    model_name: str = Field(min_length=1, max_length=160)
    inventory_number: str = Field(min_length=1, max_length=80)
    serial_number: str = Field(min_length=1, max_length=120)
    channel_count: int = Field(gt=0)
    use_id: int
    pipette_type_id: int
    nominal_volume_ul: float = Field(gt=0)
    calibration_interval_months: Literal[6, 12]
    application_id: int
    room_id: int


class PipetteListItem(BaseModel):
    id: int
    register_number: int
    inventory_number: str
    serial_number: str
    description: str
    manufacturer: str
    model_name: str
    channel_count: int
    nominal_volume_ul: float
    calibration_interval_months: int
    status: str
    room: str
    use: str
    application: str
    pipette_type: str


class PipetteDetail(PipetteListItem):
    calibrations: List[CalibrationRead] = []
