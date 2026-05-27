from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import init_database
from app.routers.pipettes import router as pipettes_router
from app.routers.reference_data import router as reference_data_router


def create_app(*, initialize_database: bool = True) -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name)

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

    app.include_router(reference_data_router, prefix=settings.api_prefix)
    app.include_router(pipettes_router, prefix=settings.api_prefix)

    if initialize_database:

        @app.on_event("startup")
        def startup() -> None:
            init_database()

    return app


app = create_app()
