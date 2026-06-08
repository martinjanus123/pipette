from typing import Annotated, Any

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Application, PipetteType, Room, Usage
from app.schemas.reference_data import ReferenceItem

router = APIRouter()
DbSession = Annotated[Session, Depends(get_db)]


def _active_items(db: Session, model: type[Any]) -> list[ReferenceItem]:
    return list(db.scalars(select(model).where(model.is_active.is_(True)).order_by(model.name)).all())


@router.get("/rooms")
def list_rooms(db: DbSession) -> list[ReferenceItem]:
    return _active_items(db, Room)


@router.get("/applications")
def list_applications(db: DbSession) -> list[ReferenceItem]:
    return _active_items(db, Application)


@router.get("/uses")
def list_uses(db: DbSession) -> list[ReferenceItem]:
    return _active_items(db, Usage)


@router.get("/pipette-types")
def list_pipette_types(db: DbSession) -> list[ReferenceItem]:
    return _active_items(db, PipetteType)
