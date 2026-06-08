from typing import Literal

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


class PipetteDetail(PipetteListItem):
    pass
