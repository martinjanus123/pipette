"""Seed master data for rooms, applications, uses, and pipette_types."""

from sqlalchemy.orm import Session

from app.models.application import Application
from app.models.pipette_type import PipetteType
from app.models.room import Room
from app.models.uses import Uses


def seed_database(session: Session) -> None:
    rooms = [
        Room(name="Labor 1a"),
        Room(name="Labor 1b"),
        Room(name="Labor 3"),
    ]
    for room in rooms:
        existing = session.query(Room).filter_by(name=room.name).first()
        if not existing:
            session.add(room)

    applications = [
        Application(name="Sterilwerkbank"),
        Application(name="Assays"),
        Application(name="Qubit/Bioanalyzer"),
        Application(name="PCR-Platz"),
        Application(name="Extraktion cf-DNA"),
        Application(name="Prüfungen"),
        Application(name="Countess"),
        Application(name="ddPCR"),
    ]
    for app in applications:
        existing = session.query(Application).filter_by(name=app.name).first()
        if not existing:
            session.add(app)

    uses = [
        Uses(name="FuE"),
        Uses(name="Prüfungen"),
    ]
    for use in uses:
        existing = session.query(Uses).filter_by(name=use.name).first()
        if not existing:
            session.add(use)

    pipette_types = [
        PipetteType(name="Luftpolsterpipette"),
        PipetteType(name="Direktverdränger"),
    ]
    for pt in pipette_types:
        existing = session.query(PipetteType).filter_by(name=pt.name).first()
        if not existing:
            session.add(pt)

    session.commit()
