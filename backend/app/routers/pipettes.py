from datetime import datetime, timezone
from typing import Annotated, Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.database import get_db
from app.models import Application, Pipette, PipetteEvent, PipetteType, Room, Usage
from app.schemas.pipette import (
    PipetteCreate,
    PipetteDetail,
    PipetteListItem,
    PipettePaginatedResponse,
)

router = APIRouter(prefix="/pipettes")
DbSession = Annotated[Session, Depends(get_db)]
SearchQuery = Annotated[Optional[str], Query()]
LimitQuery = Annotated[int, Query(ge=1, le=200)]
OffsetQuery = Annotated[int, Query(ge=0)]

# Optional filter query params (no alias needed as variable names match query param names)
RoomIdQuery = Annotated[Optional[int], Query()]
ApplicationIdQuery = Annotated[Optional[int], Query()]
UseIdQuery = Annotated[Optional[int], Query()]
PipetteTypeIdQuery = Annotated[Optional[int], Query()]
StatusQuery = Annotated[Optional[str], Query()]


def _description(manufacturer: str, model_name: str, nominal_volume_ul: float) -> str:
    volume = int(nominal_volume_ul) if nominal_volume_ul.is_integer() else nominal_volume_ul
    return f"{manufacturer} {model_name} {volume} µL"


def _next_register_number(db: Session) -> int:
    current_max = db.scalar(select(func.max(Pipette.register_number)))
    return (current_max or 0) + 1


def _as_list_item(pipette: Pipette) -> PipetteListItem:
    return PipetteListItem(
        id=pipette.id,
        register_number=pipette.register_number,
        inventory_number=pipette.inventory_number,
        serial_number=pipette.serial_number,
        description=pipette.description,
        manufacturer=pipette.manufacturer,
        model_name=pipette.model_name,
        channel_count=pipette.channel_count,
        nominal_volume_ul=pipette.nominal_volume_ul,
        calibration_interval_months=pipette.calibration_interval_months,
        status=pipette.status,
        room=pipette.room.name,
        use=pipette.usage.name,
        application=pipette.application.name,
        pipette_type=pipette.pipette_type.name,
    )


def _ensure_reference_exists(db: Session, model: type[Any], item_id: int, label: str) -> None:
    exists = db.scalar(select(model.id).where(model.id == item_id))
    if exists is None:
        raise HTTPException(status_code=422, detail=f"Unknown {label}: {item_id}")


def _raise_pipette_not_found() -> None:
    raise StarletteHTTPException(status_code=404, detail="Pipette not found")


@router.get("")
def list_pipettes(
    db: DbSession,
    q: SearchQuery = None,
    limit: LimitQuery = 50,
    offset: OffsetQuery = 0,
    room_id: RoomIdQuery = None,
    application_id: ApplicationIdQuery = None,
    use_id: UseIdQuery = None,
    pipette_type_id: PipetteTypeIdQuery = None,
    status: StatusQuery = None,
) -> PipettePaginatedResponse:
    # Base statement with eager loads
    base_stmt = (
        select(Pipette)
        .options(
            joinedload(Pipette.room),
            joinedload(Pipette.usage),
            joinedload(Pipette.application),
            joinedload(Pipette.pipette_type),
        )
        .order_by(Pipette.register_number)
    )
    # Apply filters
    if q:
        like = f"%{q}%"
        base_stmt = base_stmt.where(
            or_(
                Pipette.inventory_number.ilike(like),
                Pipette.serial_number.ilike(like),
                Pipette.description.ilike(like),
                Pipette.manufacturer.ilike(like),
                Pipette.model_name.ilike(like),
            )
        )
    if room_id is not None:
        base_stmt = base_stmt.where(Pipette.room_id == room_id)
    if application_id is not None:
        base_stmt = base_stmt.where(Pipette.application_id == application_id)
    if use_id is not None:
        base_stmt = base_stmt.where(Pipette.use_id == use_id)
    if pipette_type_id is not None:
        base_stmt = base_stmt.where(Pipette.pipette_type_id == pipette_type_id)
    if status is not None:
        base_stmt = base_stmt.where(Pipette.status == status)

    # Total count before pagination – use distinct primary key to avoid duplicates from joins
    count_stmt = select(func.count(Pipette.id)).select_from(base_stmt.subquery())
    total = db.scalar(count_stmt) or 0

    # Apply pagination
    paged_stmt = base_stmt.limit(limit).offset(offset)
    items = [_as_list_item(p) for p in db.scalars(paged_stmt).all()]

    return PipettePaginatedResponse(items=items, total=total, limit=limit, offset=offset)


@router.post(
    "",
    status_code=201,
    responses={
        409: {"description": "Pipette already exists"},
        422: {"description": "Unknown reference data"},
    },
)
def create_pipette(payload: PipetteCreate, db: DbSession) -> PipetteDetail:
    _ensure_reference_exists(db, Room, payload.room_id, "room_id")
    _ensure_reference_exists(db, Application, payload.application_id, "application_id")
    _ensure_reference_exists(db, Usage, payload.use_id, "use_id")
    _ensure_reference_exists(db, PipetteType, payload.pipette_type_id, "pipette_type_id")

    pipette = Pipette(
        register_number=_next_register_number(db),
        inventory_number=payload.inventory_number,
        serial_number=payload.serial_number,
        manufacturer=payload.manufacturer,
        model_name=payload.model_name,
        description=_description(
            payload.manufacturer,
            payload.model_name,
            payload.nominal_volume_ul,
        ),
        channel_count=payload.channel_count,
        use_id=payload.use_id,
        pipette_type_id=payload.pipette_type_id,
        nominal_volume_ul=payload.nominal_volume_ul,
        calibration_interval_months=payload.calibration_interval_months,
        application_id=payload.application_id,
        room_id=payload.room_id,
        status="active",
    )
    db.add(pipette)
    db.flush()
    db.add(
        PipetteEvent(
            pipette_id=pipette.id,
            event_type="created",
            event_date=datetime.now(timezone.utc),
            new_value=pipette.description,
            notes="Pipette created from baseline API",
            created_by="system",
        )
    )

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Pipette already exists") from exc

    db.refresh(pipette)
    return get_pipette(pipette.id, db)


@router.get(
    "/{pipette_id}",
    responses={
        404: {
            "description": "Pipette not found",
            "content": {"application/json": {"example": {"detail": "Pipette not found"}}},
        },
    },
)
def get_pipette(pipette_id: int, db: DbSession) -> PipetteDetail:
    pipette = db.scalar(
        select(Pipette)
        .where(Pipette.id == pipette_id)
        .options(
            joinedload(Pipette.room),
            joinedload(Pipette.usage),
            joinedload(Pipette.application),
            joinedload(Pipette.pipette_type),
        )
    )
    if pipette is None:
        _raise_pipette_not_found()
    return _as_list_item(pipette)
