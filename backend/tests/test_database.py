from sqlalchemy import inspect

from app.models import Application, PipetteType, Room, Uses
from app.seed import seed_database


class TestDatabaseConnection:
    def test_metadata_tables_exist(self, db_session):
        inspector = inspect(db_session.bind)
        tables = inspector.get_table_names()
        expected = {
            "rooms",
            "applications",
            "uses",
            "pipette_types",
            "pipettes",
            "calibrations",
            "pipette_events",
        }
        assert expected.issubset(tables), f"Missing tables: {expected - set(tables)}"

    def test_seed_data_rooms(self, db_session):
        seed_database(db_session)
        rooms = db_session.query(Room).all()
        assert len(rooms) == 3
        names = {r.name for r in rooms}
        assert names == {"Labor 1a", "Labor 1b", "Labor 3"}

    def test_seed_data_applications(self, db_session):
        seed_database(db_session)
        apps = db_session.query(Application).all()
        assert len(apps) == 8
        names = {a.name for a in apps}
        assert "Sterilwerkbank" in names
        assert "Assays" in names
        assert "Qubit/Bioanalyzer" in names
        assert "PCR-Platz" in names
        assert "Extraktion cf-DNA" in names
        assert "Prüfungen" in names
        assert "Countess" in names
        assert "ddPCR" in names

    def test_seed_data_uses(self, db_session):
        seed_database(db_session)
        uses = db_session.query(Uses).all()
        assert len(uses) == 2
        names = {u.name for u in uses}
        assert names == {"FuE", "Prüfungen"}

    def test_seed_data_pipette_types(self, db_session):
        seed_database(db_session)
        pts = db_session.query(PipetteType).all()
        assert len(pts) == 2
        names = {pt.name for pt in pts}
        assert names == {"Luftpolsterpipette", "Direktverdränger"}

    def test_seed_idempotent(self, db_session):
        seed_database(db_session)
        seed_database(db_session)
        assert db_session.query(Room).count() == 3
        assert db_session.query(Application).count() == 8
        assert db_session.query(Uses).count() == 2
        assert db_session.query(PipetteType).count() == 2
