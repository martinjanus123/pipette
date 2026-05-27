from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base


class Pipette(Base):
    __tablename__ = "pipettes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    register_number: Mapped[int] = mapped_column(Integer, unique=True, nullable=False)
    inventory_number: Mapped[str] = mapped_column(String(255), nullable=False)
    serial_number: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    manufacturer: Mapped[str] = mapped_column(String(255), nullable=False)
    model_name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    channel_count: Mapped[int] = mapped_column(Integer, nullable=False)
    use_id: Mapped[int] = mapped_column(Integer, ForeignKey("uses.id"), nullable=False)
    pipette_type_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("pipette_types.id"), nullable=False
    )
    nominal_volume_ul: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    calibration_interval_months: Mapped[int] = mapped_column(Integer, nullable=False)
    application_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("applications.id"), nullable=False
    )
    room_id: Mapped[int] = mapped_column(Integer, ForeignKey("rooms.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="active", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    room = relationship("Room", back_populates="pipettes", lazy="select")
    use = relationship("Uses", back_populates="pipettes", lazy="select")
    application = relationship("Application", back_populates="pipettes", lazy="select")
    pipette_type = relationship("PipetteType", back_populates="pipettes", lazy="select")
    calibrations = relationship(
        "Calibration",
        back_populates="pipette",
        lazy="select",
        order_by="Calibration.calibration_date.desc()",
    )
    events = relationship(
        "PipetteEvent",
        back_populates="pipette",
        lazy="select",
        order_by="PipetteEvent.created_at.desc()",
    )
