from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Application
from app.schemas.reference_data import ReferenceItem
from app.schemas.application import ApplicationCreate

router = APIRouter()
DbSession = Depends(get_db)

@router.post("/applications", response_model=ReferenceItem)
def create_application(payload: ApplicationCreate, db: Session = DbSession):
    """Create a new Application.

    Returns the created application as a ``ReferenceItem``. If an application with
    the same name already exists, a ``409 Conflict`` is returned.
    """
    # Check for existing application with the same name
    existing = db.scalar(select(Application).where(Application.name == payload.name))
    if existing:
        raise HTTPException(status_code=409, detail="Application already exists")
    new_app = Application(name=payload.name)
    db.add(new_app)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Application already exists")
    db.refresh(new_app)
    return new_app
