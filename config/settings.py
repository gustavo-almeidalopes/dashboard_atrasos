"""Application configuration — loads from .env file."""

import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

DATA_DIR = BASE_DIR / "data"
STATIC_DIR = BASE_DIR / "static"
LOCAL_CSV = DATA_DIR / "dados.csv"

DATABASE_URL = os.getenv("DATABASE_URL", "")
REMOTE_CSV_URL = os.getenv("DATA_SOURCE_URL", "")

ALLOWED_ORIGINS = [
    o.strip()
    for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:8000,http://localhost:3000").split(",")
    if o.strip()
]

TOP_RANKING = int(os.getenv("TOP_RANKING", "8"))

EXPECTED_COLUMNS = [
    "PLACA", "ÚLTIMA COMUNICAÇÃO", "TEMPO DE ATRASO", "CATEGORIA",
    "DATA", "HORA", "ATRASO (MIN)", "FAIXA DE ATRASO", "DIA DA SEMANA", "MÊS",
]
