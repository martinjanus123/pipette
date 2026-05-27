from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Application, PipetteType, Room, Usage


ROOMS = ["Labor 1a", "Labor 1b", "Labor 3"]
APPLICATIONS = [
    "Sterilwerkbank",
    "Assays",
    "Qubit/Bioanalyzer",
    "PCR-Platz",
    "Extraktion cf-DNA",
    "Prüfungen",
    "Countess",
    "ddPCR",
]
USES = ["FuE", "Prüfungen"]
PIPETTE_TYPES = ["Luftpolsterpipette", "Direktverdränger"]


def _seed_names(db: Session, model: type, names: list[str]) -> None:
    existing = set(db.scalars(select(model.name)).all())
    for name in names:
        if name not in existing:
            db.add(model(name=name))


def seed_reference_data(db: Session) -> None:
    _seed_names(db, Room, ROOMS)
    _seed_names(db, Application, APPLICATIONS)
    _seed_names(db, Usage, USES)
    _seed_names(db, PipetteType, PIPETTE_TYPES)
    db.commit()
