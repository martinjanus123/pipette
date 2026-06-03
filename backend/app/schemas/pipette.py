from typing import Literal, Optional, List

from pydantic import BaseModel, Field
from datetime import datetime


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


class PipetteEventDetail(BaseModel):
    id: int
    event_type: str
    event_date: datetime
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    notes: Optional[str] = None
    created_by: Optional[str] = None


class PipetteDetail(PipetteListItem):
    events: List[PipetteEventDetail] = []


class PipetteStatusChange(BaseModel):
    new_status: Literal["active", "maintenance", "retired"]
    notes: Optional[str] = None
    created_by: Optional[str] = None
