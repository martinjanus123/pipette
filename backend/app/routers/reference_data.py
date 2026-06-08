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
    return list(db.scalars(select(model).where(model.is_active.is_(True)).order_by(model.name)).all()


@router.get("/rooms")
def list_rooms(db: DbSession) -> list[ReferenceItem]:
    return _active_items(db, Room)


@router.get("/applications")
def list_applications(db: DbSession) -> list[ReferenceItem]:
    return _active_items(db, Application)
+
+
+@router.post(
+    "/applications",
+    status_code=201,
+    responses={
+        409: {"description": "Application already exists"},
+    },
+)
+def create_application(payload: ApplicationCreate, db: DbSession) -> ReferenceItem:
+    # Check for duplicate name (case-sensitive as DB unique constraint)
+    existing = db.scalar(select(Application.id).where(Application.name == payload.name))
+    if existing is not None:
+        raise HTTPException(status_code=409, detail="Application already exists")
+
+    app = Application(name=payload.name, is_active=True)
+    db.add(app)
+    try:
+        db.commit()
+    except IntegrityError as exc:
+        db.rollback()
+        raise HTTPException(status_code=409, detail="Application already exists") from exc
+    db.refresh(app)
+    return ReferenceItem.from_orm(app)


@router.get("/uses")
def list_uses(db: DbSession) -> list[ReferenceItem]:
    return _active_items(db, Usage)


@router.get("/pipette-types")
def list_pipette_types(db: DbSession) -> list[ReferenceItem]:
    return _active_items(db, PipetteType)
