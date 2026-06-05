from datetime import datetime, timezone
from typing import Annotated, Any, List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.database import get_db
from app.models import Application, Pipette, PipetteEvent, PipetteType, Room, Usage
from app.schemas.pipette import PipetteCreate, PipetteDetail, PipetteListItem
+from app.schemas.timeline import TimelineEntry
@@
 def get_pipette(pipette_id: int, db: DbSession) -> PipetteDetail:
@@
     return _as_list_item(pipette)
+
+
+@router.get(
+    "/{pipette_id}/timeline",
+    response_model=List[TimelineEntry],
+    responses={404: {"description": "Pipette not found"}},
+)
+def get_pipette_timeline(pipette_id: int, db: DbSession) -> List[TimelineEntry]:
+    """Return a combined, descending sorted timeline of events and calibrations for a pipette."""
+    pipette = db.scalar(
+        select(Pipette)
+        .where(Pipette.id == pipette_id)
+        .options(joinedload(Pipette.events), joinedload(Pipette.calibrations))
+    )
+    if pipette is None:
+        _raise_pipette_not_found()
+
+    entries: List[TimelineEntry] = []
+    # Events
+    for ev in pipette.events:
+        title = ev.event_type.replace("_", " ").title()
+        detail = ev.notes or ev.new_value or ev.old_value
+        entries.append(
+            TimelineEntry(
+                type="event",
+                date=ev.event_date,
+                title=title,
+                detail_text=detail,
+                source="event",
+            )
+        )
+    # Calibrations
+    for cal in pipette.calibrations:
+        title = f"Calibration {cal.result or ''}".strip()
+        detail = cal.notes or cal.certificate_reference
+        entries.append(
+            TimelineEntry(
+                type="calibration",
+                date=cal.calibration_date,
+                title=title,
+                detail_text=detail,
+                source="calibration",
+            )
+        )
+
+    # Sort descending by date
+    entries.sort(key=lambda e: e.date, reverse=True)
+    return entries
*** End Patch