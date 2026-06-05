from typing import Literal, List, Optional

from pydantic import BaseModel, Field


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


class CalibrationCreate(BaseModel):
    calibration_date: str = Field(..., description="YYYY-MM-DD")
    next_due_date: str = Field(..., description="YYYY-MM-DD")
    result: Optional[str] = None
    performed_by: Optional[str] = None
    certificate_reference: Optional[str] = None
    notes: Optional[str] = None


class CalibrationDetail(BaseModel):
    id: int
    calibration_date: str
    next_due_date: str
    result: Optional[str] = None
    performed_by: Optional[str] = None
    certificate_reference: Optional[str] = None
    notes: Optional[str] = None


class PipetteDetail(PipetteListItem):
    calibrations: List[CalibrationDetail] = []
