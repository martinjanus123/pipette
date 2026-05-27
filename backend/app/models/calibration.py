from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Calibration(Base):
    __tablename__ = "calibrations"

    id: Mapped[int] = mapped_column(primary_key=True)
    pipette_id: Mapped[int] = mapped_column(ForeignKey("pipettes.id"), nullable=False)
    calibration_date: Mapped[date] = mapped_column(Date, nullable=False)
    next_due_date: Mapped[date] = mapped_column(Date, nullable=False)
    result: Mapped[str | None] = mapped_column(String(80))
    performed_by: Mapped[str | None] = mapped_column(String(120))
    certificate_reference: Mapped[str | None] = mapped_column(String(160))
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    pipette = relationship("Pipette", back_populates="calibrations")
