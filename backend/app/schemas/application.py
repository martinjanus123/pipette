from pydantic import BaseModel, Field


class ApplicationCreate(BaseModel):
    """Schema for creating a new Application.

    The name must be a non‑empty string with a reasonable length constraint.
    """

    name: str = Field(..., min_length=1, max_length=160)

    model_config = {"from_attributes": True}
