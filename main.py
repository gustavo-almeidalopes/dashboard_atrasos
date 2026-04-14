"""ECOLIMP — FastAPI Application Entry Point."""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from config.settings import ALLOWED_ORIGINS, BASE_DIR
from routers import data, analysis
from services.db import init_db

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("ecolimp")

DIST_DIR = BASE_DIR / "dist"


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting ECOLIMP API")
    init_db()
    logger.info("Database initialized")
    yield


app = FastAPI(
    title="ECOLIMP API",
    version="3.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(data.router)
app.include_router(analysis.router)


@app.get("/health")
def health():
    return {"status": "ok"}


if DIST_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(DIST_DIR / "assets")), name="assets")

    @app.get("/{path:path}")
    def serve_spa(path: str):
        file = DIST_DIR / path
        if file.exists() and file.is_file():
            return FileResponse(str(file))
        return FileResponse(str(DIST_DIR / "index.html"))
