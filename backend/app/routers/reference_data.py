from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Application, PipetteType, Room, Usage
from app.schemas.reference_data import ReferenceItem, ApplicationCreate

router = APIRouter()
DbSession = Annotated[Session, Depends(get_db)]


def _active_items(db: Session, model: type[Any]) -> list[ReferenceItem]:
    return db.scalars(
        select(model).where(model.is_active.is_(True)).order_by(model.name)
    ).all()


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


@router.post("/applications", response_model=ReferenceItem, status_code=201)
def create_application(payload: ApplicationCreate, db: DbSession) -> ReferenceItem:
    """Create a new application if it does not exist.

    Returns the existing application if a duplicate name is submitted.
    """
    # Check for existing application by name
    existing = db.scalar(select(Application).where(Application.name == payload.name))
    if existing:
        return existing

    app = Application(name=payload.name, is_active=True)
    db.add(app)
    try:
        db.flush()
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        # In case of race condition, fetch the existing record
        existing = db.scalar(select(Application).where(Application.name == payload.name))
        if existing:
            return existing
        raise HTTPException(status_code=409, detail="Application could not be created") from exc
    return app
