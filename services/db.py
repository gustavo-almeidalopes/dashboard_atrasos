"""Database connection and session management."""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from config.settings import DATABASE_URL
from models.database import Base

_engine = None
_SessionLocal = None


def _get_engine():
    global _engine
    if _engine is None and DATABASE_URL:
        _engine = create_engine(
            DATABASE_URL,
            pool_pre_ping=True,
            pool_size=5,
            max_overflow=10,
        )
    return _engine


def _get_session_factory():
    global _SessionLocal
    if _SessionLocal is None:
        engine = _get_engine()
        if engine:
            _SessionLocal = sessionmaker(bind=engine, autoflush=False)
    return _SessionLocal


def init_db():
    """Create tables if they don't exist."""
    engine = _get_engine()
    if engine:
        Base.metadata.create_all(bind=engine)


def get_session() -> Session:
    """Get a new database session."""
    factory = _get_session_factory()
    if not factory:
        raise RuntimeError("DATABASE_URL not configured. Check your .env file.")
    return factory()
