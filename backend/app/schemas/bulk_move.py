from typing import List, Optional

from pydantic import BaseModel, Field


class BulkMovePayload(BaseModel):
    pipette_ids: List[int] = Field(..., min_items=1)
    target_room_id: int
    notes: Optional[str] = None
    moved_by: str = Field(..., min_length=1, max_length=120)
