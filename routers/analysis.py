"""Analysis endpoint: single /dashboard call returns everything the frontend needs."""

import pandas as pd
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from models.schemas import (
    DashboardResponse, DataStatus, KPIs, HourlyVolume, HourlyPoint,
    RankingResponse, RankingEntry, TableResponse, TableRow,
    DistributionResponse, DistributionEntry,
)
from models.database import Record
from services.db import get_session
from services.processing import (
    compute_kpis, compute_hourly, compute_ranking,
    compute_distribution, DOW_ORDER, MONTH_ORDER,
    STATUS_ORDER, RISCO_ORDER, PERIODO_ORDER, ACAO_ORDER,
)
from utils.helpers import format_minutes
from config.settings import TOP_RANKING

router = APIRouter(prefix="/api/analysis", tags=["analysis"])


def get_db():
    db = get_session()
    try:
        yield db
    finally:
        db.close()


def _query_to_df(db: Session, source: str | None = None) -> pd.DataFrame:
    """Query records from the database and return as a pandas DataFrame."""
    q = db.query(Record)
    if source:
        q = q.filter(Record.source == source)
    rows = q.all()
    if not rows:
        return pd.DataFrame()
    return pd.DataFrame([{
        "placa": r.placa, "hora_dt": r.ultima_comunicacao, "hour": None,
        "delay": float(r.total_min or 0), "total_min": r.total_min,
        "categoria": r.categoria, "dia_semana": r.dia,
        "mes": None, "source": r.source,
        "status": r.status, "risco": r.risco, "periodo": r.periodo,
        "acao": r.acao, "critico": r.critico or False,
        "sla_ok": r.sla_ok or 0, "score": r.score or 0,
        "score_final": r.score_final or 0.0,
        "reincidencia": r.reincidencia or 0,
        "fim_semana": r.fim_semana or False,
        "horas": r.horas or 0, "minutos": r.minutos or 0,
        "tempo_decimal": r.tempo_decimal or 0.0,
    } for r in rows])


def _enrich_df(df: pd.DataFrame) -> pd.DataFrame:
    """Derive hour and month from the data if not present."""
    if df.empty:
        return df
    if "hora_dt" in df.columns:
        df["hour"] = df["hora_dt"].apply(
            lambda x: x.hour if pd.notna(x) and hasattr(x, "hour") else None
        )
        df["mes"] = df["hora_dt"].apply(
            lambda x: {1: "Janeiro", 2: "Fevereiro", 3: "Março", 4: "Abril",
                       5: "Maio", 6: "Junho", 7: "Julho", 8: "Agosto",
                       9: "Setembro", 10: "Outubro", 11: "Novembro", 12: "Dezembro"
                       }.get(x.month) if pd.notna(x) and hasattr(x, "month") else None
        )
    # Map short dia to full name for distributions
    dow_short = {"Seg": "Segunda", "Ter": "Terça", "Qua": "Quarta",
                 "Qui": "Quinta", "Sex": "Sexta", "Sáb": "Sábado", "Dom": "Domingo"}
    if "dia_semana" in df.columns:
        df["dia_semana_full"] = df["dia_semana"].map(dow_short).fillna(df["dia_semana"])
    return df


@router.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(
    view: str = Query("comparativo", pattern="^(comparativo|seguranca|telemetria)$"),
    db: Session = Depends(get_db),
):
    """Return all dashboard data for a given view in a single call."""
    is_comp = view == "comparativo"
    is_seg = view == "seguranca"
    is_tel = view == "telemetria"

    sec_count = db.query(func.count(Record.id)).filter(Record.source == "security").scalar()
    tel_count = db.query(func.count(Record.id)).filter(Record.source == "telemetry").scalar()

    status = DataStatus(
        security_loaded=sec_count > 0,
        telemetry_loaded=tel_count > 0,
        security_rows=sec_count,
        telemetry_rows=tel_count,
    )

    sec_df = _enrich_df(_query_to_df(db, "security")) if (is_comp or is_seg) and sec_count > 0 else pd.DataFrame()
    tel_df = _enrich_df(_query_to_df(db, "telemetry")) if (is_comp or is_tel) and tel_count > 0 else pd.DataFrame()

    kpis_sec = KPIs(**compute_kpis(sec_df)) if not sec_df.empty else None
    kpis_tel = KPIs(**compute_kpis(tel_df)) if not tel_df.empty else None

    combined_unique = 0
    combined_total = 0
    if is_comp:
        plates = set()
        if not sec_df.empty:
            plates.update(sec_df["placa"].unique())
            combined_total += len(sec_df)
        if not tel_df.empty:
            plates.update(tel_df["placa"].unique())
            combined_total += len(tel_df)
        combined_unique = len(plates)

    hourly_sec = HourlyVolume(data=[HourlyPoint(**p) for p in compute_hourly(sec_df if not sec_df.empty else None)])
    hourly_tel = HourlyVolume(data=[HourlyPoint(**p) for p in compute_hourly(tel_df if not tel_df.empty else None)])

    frames = []
    if not sec_df.empty:
        frames.append(sec_df)
    if not tel_df.empty:
        frames.append(tel_df)
    combined = pd.concat(frames, ignore_index=True) if frames else pd.DataFrame()

    # Ranking
    rank_df = compute_ranking(combined, top_n=TOP_RANKING)
    ranking_items = []
    max_delay = rank_df["total_delay"].max() if not rank_df.empty else 1
    for rank, row in rank_df.iterrows():
        plate = row["placa"]
        sources = sorted(combined[combined["placa"] == plate]["source"].unique().tolist()) if not combined.empty else []
        pct = max(5, (row["total_delay"] / max_delay) * 100) if max_delay > 0 else 5
        ranking_items.append(RankingEntry(
            rank=rank, placa=plate, count=row["count"],
            total_delay=row["total_delay"],
            total_delay_formatted=format_minutes(row["total_delay"]),
            sources=sources, pct=pct,
            avg_score=round(row.get("avg_score", 0), 1),
            max_reincidencia=int(row.get("max_reincidencia", 0)),
        ))
    ranking = RankingResponse(items=ranking_items)

    # Table with extra info
    table_rows = []
    for item in ranking_items:
        plate_data = combined[combined["placa"] == item.placa] if not combined.empty else pd.DataFrame()
        worst_status = ""
        worst_risco = ""
        worst_acao = ""
        max_reinc = 0
        if not plate_data.empty:
            for col, order in [("status", STATUS_ORDER), ("risco", RISCO_ORDER), ("acao", ACAO_ORDER)]:
                if col in plate_data.columns:
                    vals = plate_data[col].dropna().unique()
                    for o in order:
                        if o in vals:
                            if col == "status":
                                worst_status = o
                            elif col == "risco":
                                worst_risco = o
                            else:
                                worst_acao = o
                            break
            if "reincidencia" in plate_data.columns:
                max_reinc = int(plate_data["reincidencia"].max())

        table_rows.append(TableRow(
            placa=item.placa, sources=item.sources,
            count=item.count, total_delay_formatted=item.total_delay_formatted,
            status=worst_status, risco=worst_risco,
            acao=worst_acao, reincidencia=max_reinc,
        ))
    table = TableResponse(rows=table_rows)

    # All distributions
    dist_dow = DistributionResponse(data=[
        DistributionEntry(**d) for d in compute_distribution(combined, "dia_semana_full", DOW_ORDER)
    ])
    dist_month = DistributionResponse(data=[
        DistributionEntry(**d) for d in compute_distribution(combined, "mes", MONTH_ORDER)
    ])
    dist_status = DistributionResponse(data=[
        DistributionEntry(**d) for d in compute_distribution(combined, "status", STATUS_ORDER)
    ])
    dist_risco = DistributionResponse(data=[
        DistributionEntry(**d) for d in compute_distribution(combined, "risco", RISCO_ORDER)
    ])
    dist_periodo = DistributionResponse(data=[
        DistributionEntry(**d) for d in compute_distribution(combined, "periodo", PERIODO_ORDER)
    ])
    dist_acao = DistributionResponse(data=[
        DistributionEntry(**d) for d in compute_distribution(combined, "acao", ACAO_ORDER)
    ])
    dist_cat = DistributionResponse(data=[
        DistributionEntry(**d) for d in compute_distribution(combined, "categoria")
    ])

    return DashboardResponse(
        status=status,
        kpis_security=kpis_sec if (is_comp or is_seg) else None,
        kpis_telemetry=kpis_tel if (is_comp or is_tel) else None,
        combined_unique_plates=combined_unique,
        combined_total_rows=combined_total,
        hourly_security=hourly_sec,
        hourly_telemetry=hourly_tel,
        ranking=ranking,
        table=table,
        dist_dow=dist_dow,
        dist_month=dist_month,
        dist_status=dist_status,
        dist_risco=dist_risco,
        dist_periodo=dist_periodo,
        dist_acao=dist_acao,
        dist_categoria=dist_cat,
    )
