from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class PipetteEvent(Base):
    __tablename__ = "pipette_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    pipette_id: Mapped[int] = mapped_column(ForeignKey("pipettes.id"), nullable=False)
    event_type: Mapped[str] = mapped_column(String(80), nullable=False)
    event_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    old_value: Mapped[str | None] = mapped_column(Text)
    new_value: Mapped[str | None] = mapped_column(Text)
    notes: Mapped[str | None] = mapped_column(Text)
    created_by: Mapped[str | None] = mapped_column(String(120))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    pipette = relationship("Pipette", back_populates="events")
