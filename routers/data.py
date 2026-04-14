"""Data status endpoint — reads from PostgreSQL database."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from models.schemas import DataStatus
from models.database import Record
from services.db import get_session

router = APIRouter(prefix="/api/data", tags=["data"])


def get_db():
    db = get_session()
    try:
        yield db
    finally:
        db.close()


@router.get("/status", response_model=DataStatus)
def data_status(db: Session = Depends(get_db)):
    """Return what data is currently loaded in the database."""
    sec_count = db.query(func.count(Record.id)).filter(Record.source == "security").scalar()
    tel_count = db.query(func.count(Record.id)).filter(Record.source == "telemetry").scalar()
    return DataStatus(
        security_loaded=sec_count > 0,
        telemetry_loaded=tel_count > 0,
        security_rows=sec_count,
        telemetry_rows=tel_count,
    )
