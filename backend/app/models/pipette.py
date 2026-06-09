from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base_mixins import TimestampMixin


class Pipette(TimestampMixin, Base):
    __tablename__ = "pipettes"

    id: Mapped[int] = mapped_column(primary_key=True)
    register_number: Mapped[int] = mapped_column(Integer, unique=True, index=True, nullable=False)
    inventory_number: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    serial_number: Mapped[str] = mapped_column(String(120), unique=True, index=True, nullable=False)
    manufacturer: Mapped[str] = mapped_column(String(120), nullable=False)
    model_name: Mapped[str] = mapped_column(String(160), nullable=False)
    description: Mapped[str] = mapped_column(String(320), nullable=False)
    channel_count: Mapped[int] = mapped_column(Integer, nullable=False)
    use_id: Mapped[int] = mapped_column(ForeignKey("uses.id"), nullable=False)
    pipette_type_id: Mapped[int] = mapped_column(ForeignKey("pipette_types.id"), nullable=False)
    nominal_volume_ul: Mapped[float] = mapped_column(Float, nullable=False)
    calibration_interval_months: Mapped[int] = mapped_column(Integer, nullable=False)
    application_id: Mapped[int] = mapped_column(ForeignKey("applications.id"), nullable=False)
    room_id: Mapped[int] = mapped_column(ForeignKey("rooms.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(40), default="active", nullable=False)

    usage = relationship("Usage", back_populates="pipettes")
    pipette_type = relationship("PipetteType", back_populates="pipettes")
    application = relationship("Application", back_populates="pipettes")
    room = relationship("Room", back_populates="pipettes")
    calibrations = relationship("Calibration", back_populates="pipette", cascade="all, delete-orphan")
    events = relationship("PipetteEvent", back_populates="pipette", cascade="all, delete-orphan")

    @property
    def latest_calibration_date(self) -> datetime | None:
        if not self.calibrations:
            return None
        return max(calibration.calibration_date for calibration in self.calibrations)
