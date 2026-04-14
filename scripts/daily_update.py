"""Daily ETL: download CSV from DATA_SOURCE_URL and upsert into the database."""

import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from config.settings import REMOTE_CSV_URL, DATABASE_URL
from services.ingestion import load_from_url
from services.processing import map_columns, process_dataframe
from services.validation import validate_dataframe
from services.db import init_db, get_session
from models.database import Record

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("daily_update")


def run():
    if not REMOTE_CSV_URL:
        logger.error("DATA_SOURCE_URL not set. Aborting.")
        sys.exit(1)
    if not DATABASE_URL:
        logger.error("DATABASE_URL not set. Aborting.")
        sys.exit(1)

    logger.info("Downloading CSV from %s", REMOTE_CSV_URL)
    df_raw = load_from_url(REMOTE_CSV_URL)
    if df_raw is None or df_raw.empty:
        logger.error("Failed to load CSV or file is empty.")
        sys.exit(1)

    logger.info("Loaded %d rows, %d columns", len(df_raw), len(df_raw.columns))

    result = validate_dataframe(df_raw)
    if result["errors"]:
        for e in result["errors"]:
            logger.error("Validation error: %s", e["message"])
        sys.exit(1)
    for w in result.get("warnings", []):
        logger.warning("Validation warning: %s", w["message"])

    col_map = map_columns(df_raw)
    df = process_dataframe(df_raw, col_map)
    if df.empty:
        logger.error("Processing returned empty DataFrame.")
        sys.exit(1)

    logger.info("Processed %d records.", len(df))

    init_db()
    db = get_session()
    try:
        # Detect source from data
        sources = df["source"].unique().tolist()
        for src in sources:
            deleted = db.query(Record).filter(Record.source == src).delete()
            logger.info("Deleted %d existing '%s' records.", deleted, src)

        records = []
        for _, row in df.iterrows():
            records.append(Record(
                source=row.get("source"),
                placa=row.get("placa"),
                categoria=row.get("categoria"),
                ultima_comunicacao=row.get("ultima_comunicacao"),
                tempo_de_atraso=row.get("tempo_de_atraso"),
                horas=int(row.get("horas") or 0),
                minutos=int(row.get("minutos") or 0),
                total_min=int(row.get("total_min") or 0),
                tempo_decimal=float(row.get("tempo_decimal") or 0),
                status=row.get("status"),
                score=int(row.get("score") or 0),
                risco=row.get("risco"),
                sla_ok=int(row.get("sla_ok") or 0),
                dia=row.get("dia"),
                periodo=row.get("periodo"),
                fim_semana=bool(row.get("fim_semana")),
                acao=row.get("acao"),
                critico=bool(row.get("critico")),
                score_final=float(row.get("score_final") or 0),
                reincidencia=int(row.get("reincidencia") or 0),
                rank=row.get("rank"),
            ))

        db.bulk_save_objects(records)
        db.commit()
        logger.info("Inserted %d records successfully.", len(records))
    except Exception as exc:
        db.rollback()
        logger.exception("Database error: %s", exc)
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    run()
