from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Application, PipetteType, Room, Usage
from app.schemas.reference_data import ReferenceItem
from app.schemas.application import ApplicationCreate, ApplicationDetail

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


@router.get("/uses")
def list_uses(db: DbSession) -> list[ReferenceItem]:
    return _active_items(db, Usage)


@router.get("/pipette-types")
def list_pipette_types(db: DbSession) -> list[ReferenceItem]:
    return _active_items(db, PipetteType)
+
+
+@router.post(
+    "/applications",
+    status_code=status.HTTP_201_CREATED,
+    responses={
+        409: {"description": "Application already exists"},
+        422: {"description": "Invalid payload"},
+    },
+)
+def create_application(payload: ApplicationCreate, db: DbSession) -> ApplicationDetail:
+    """Create a new application.
+
+    The ``name`` field must be unique. If an application with the same name already
+    exists, a HTTP 409 conflict is returned.
+    """
+    new_app = Application(name=payload.name)
+    db.add(new_app)
+    try:
+        db.commit()
+    except IntegrityError as exc:
+        db.rollback()
+        raise HTTPException(status_code=409, detail="Application already exists") from exc
+
+    db.refresh(new_app)
+    return ApplicationDetail.from_orm(new_app)
