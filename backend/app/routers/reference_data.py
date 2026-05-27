from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Application, PipetteType, Room, Usage
from app.schemas.reference_data import ReferenceItem

router = APIRouter()


def _active_items(db: Session, model: type) -> list:
    return list(db.scalars(select(model).where(model.is_active.is_(True)).order_by(model.name)).all())


@router.get("/rooms", response_model=list[ReferenceItem])
def list_rooms(db: Session = Depends(get_db)) -> list:
    return _active_items(db, Room)


@router.get("/applications", response_model=list[ReferenceItem])
def list_applications(db: Session = Depends(get_db)) -> list:
    return _active_items(db, Application)


@router.get("/uses", response_model=list[ReferenceItem])
def list_uses(db: Session = Depends(get_db)) -> list:
    return _active_items(db, Usage)


@router.get("/pipette-types", response_model=list[ReferenceItem])
def list_pipette_types(db: Session = Depends(get_db)) -> list:
    return _active_items(db, PipetteType)
