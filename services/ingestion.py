"""Data ingestion: read CSV from bytes, local file, or remote URL."""

import io
import pandas as pd
import requests
from config.settings import LOCAL_CSV, DATA_DIR


def read_csv_bytes(content: bytes) -> pd.DataFrame | None:
    """Parse CSV bytes trying multiple encodings and separators."""
    for enc in ("utf-8", "latin-1", "cp1252"):
        try:
            df = pd.read_csv(io.BytesIO(content), encoding=enc, sep=None, engine="python")
            if len(df.columns) > 1:
                return df
        except (UnicodeDecodeError, pd.errors.ParserError):
            continue
    return None


def load_from_local() -> pd.DataFrame | None:
    """Load CSV from data/dados.csv."""
    if not LOCAL_CSV.exists():
        return None
    try:
        return read_csv_bytes(LOCAL_CSV.read_bytes())
    except Exception:
        return None


def load_from_url(url: str) -> pd.DataFrame | None:
    """Download CSV from remote URL."""
    if not url:
        return None
    try:
        resp = requests.get(url, timeout=30)
        resp.raise_for_status()
        return read_csv_bytes(resp.content)
    except Exception:
        return None


def save_to_local(df: pd.DataFrame) -> bool:
    """Save DataFrame to data/dados.csv."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    try:
        df.to_csv(LOCAL_CSV, index=False, encoding="utf-8")
        return True
    except Exception:
        return False
