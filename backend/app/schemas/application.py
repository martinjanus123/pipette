from pydantic import BaseModel, Field

class ApplicationCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=160)

    model_config = {"from_attributes": True}

class ApplicationDetail(BaseModel):
    id: int
    name: str
    is_active: bool

    model_config = {"from_attributes": True}
