from datetime import datetime
from pydantic import BaseModel, Field

class TimelineEntry(BaseModel):
    type: str = Field(..., description="Type of entry, e.g., 'event' or 'calibration'")
    date: datetime = Field(..., description="Date of the entry")
    title: str = Field(..., description="Short title for the entry")
    detail_text: str | None = Field(None, description="Detailed description or notes")
    source: str = Field(..., description="Source identifier, e.g., 'event' or 'calibration'")
