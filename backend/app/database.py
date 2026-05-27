from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker


class Base(DeclarativeBase):
    pass


def get_engine(database_url: str | None = None):
    from app.config import get_settings

    settings = get_settings()
    url = database_url or settings.database_url
    return create_engine(url)


def get_session_maker(engine=None):
    if engine is None:
        engine = get_engine()
    return sessionmaker(autocommit=False, autoflush=False, bind=engine)
