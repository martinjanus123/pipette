from contextlib import asynccontextmanager
from logging import getLogger

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings

logger = getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    if "sqlite" in settings.database_url or "postgresql" in settings.database_url:
        from app.database import get_engine, get_session_maker

        engine = get_engine(settings.database_url)

        from app.database import Base

        Base.metadata.create_all(bind=engine)

        session_maker = get_session_maker(engine)
        with session_maker() as session:
            from app.seed import seed_database

            seed_database(session)

        logger.info("Database initialized and seeded")
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name, lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get(f"{settings.api_prefix}/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.get(f"{settings.api_prefix}/version")
    def version() -> dict[str, str]:
        return {"version": "0.1.0"}

    return app


app = create_app()
