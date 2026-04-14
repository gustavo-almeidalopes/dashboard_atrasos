"""Data processing: column mapping, transformation, KPIs, ranking, distributions."""

import pandas as pd
from utils.helpers import normalize_string, parse_delay_text, parse_datetime, format_minutes

DOW_MAP = {0: "Segunda", 1: "Terça", 2: "Quarta", 3: "Quinta",
           4: "Sexta", 5: "Sábado", 6: "Domingo"}
MONTH_MAP = {1: "Janeiro", 2: "Fevereiro", 3: "Março", 4: "Abril",
             5: "Maio", 6: "Junho", 7: "Julho", 8: "Agosto",
             9: "Setembro", 10: "Outubro", 11: "Novembro", 12: "Dezembro"}
DOW_ORDER = list(DOW_MAP.values())
MONTH_ORDER = list(MONTH_MAP.values())

DOW_SHORT = {"Seg": "Segunda", "Ter": "Terça", "Qua": "Quarta",
             "Qui": "Quinta", "Sex": "Sexta", "Sáb": "Sábado", "Dom": "Domingo"}

STATUS_ORDER = ["PERIGO", "Muito Atrasado", "Atrasado", "Normal"]
RISCO_ORDER = ["Crítico", "Alto", "Médio", "Baixo"]
PERIODO_ORDER = ["Manhã", "Tarde", "Noite"]
ACAO_ORDER = ["Intervenção Imediata", "Verificar", "Monitorar", "OK"]


def map_columns(df: pd.DataFrame) -> dict:
    """Map DataFrame columns to logical names via normalization."""
    norm = {col: normalize_string(col) for col in df.columns}

    def find(patterns: list[str]) -> str | None:
        nps = [normalize_string(p) for p in patterns]
        for col, n in norm.items():
            if n in nps:
                return col
        for col, n in norm.items():
            for p in nps:
                if p in n or n in p:
                    return col
        return None

    return {
        "PLACA": find(["PLACA"]),
        "CATEGORIA": find(["CATEGORIA"]),
        "ULTIMA_COMUNICACAO": find(["ULTIMA_COMUNICACAO", "ÚLTIMA COMUNICAÇÃO", "ULTIMA COMUNICACAO"]),
        "TEMPO_DE_ATRASO": find(["TEMPO_DE_ATRASO", "TEMPO DE ATRASO"]),
        "HORAS": find(["HORAS"]),
        "MINUTOS": find(["MINUTOS"]),
        "TOTAL_MIN": find(["TOTAL_MIN", "ATRASO (MIN)", "ATRASO_MIN"]),
        "TEMPO_DECIMAL": find(["TEMPO_DECIMAL"]),
        "STATUS": find(["STATUS"]),
        "SCORE": find(["SCORE"]),
        "RISCO": find(["RISCO"]),
        "SLA_OK": find(["SLA_OK"]),
        "DIA": find(["DIA", "DIA DA SEMANA"]),
        "PERIODO": find(["PERIODO", "PERÍODO"]),
        "FIM_SEMANA": find(["FIM_SEMANA"]),
        "ACAO": find(["AÇÃO", "ACAO"]),
        "CRITICO": find(["CRÍTICO", "CRITICO"]),
        "SCORE_FINAL": find(["SCORE_FINAL"]),
        "REINCIDENCIA": find(["REINCIDENCIA", "REINCIDÊNCIA"]),
        "RANK": find(["RANK"]),
    }


def _safe_int(val, default=0):
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return default
    try:
        return int(float(str(val).replace(",", ".").replace("#N/D", "0")))
    except (ValueError, TypeError):
        return default


def _safe_float(val, default=0.0):
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return default
    try:
        return float(str(val).replace(",", ".").replace("#N/D", "0"))
    except (ValueError, TypeError):
        return default


def _safe_str(val):
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return None
    s = str(val).strip()
    return s if s and s != "#N/D" else None


def process_dataframe(df: pd.DataFrame, column_map: dict) -> pd.DataFrame:
    """Transform raw CSV data into clean analysis-ready DataFrame with all fields."""
    if df is None or df.empty:
        return pd.DataFrame()
    col_placa = column_map.get("PLACA")
    if not col_placa:
        return pd.DataFrame()

    records = []
    for _, row in df.iterrows():
        pv = row.get(col_placa)
        if pd.isna(pv) or str(pv).strip() == "":
            continue
        placa = str(pv).strip().upper()

        # Categoria (source)
        cat_col = column_map.get("CATEGORIA")
        categoria = _safe_str(row.get(cat_col)) if cat_col else None
        source = "security" if categoria and "Seg" in categoria else "telemetry"

        # Delay fields
        horas = _safe_int(row.get(column_map.get("HORAS")))
        minutos = _safe_int(row.get(column_map.get("MINUTOS")))
        total_min_col = column_map.get("TOTAL_MIN")
        total_min = _safe_int(row.get(total_min_col)) if total_min_col else (horas * 60 + minutos)
        tempo_decimal = _safe_float(row.get(column_map.get("TEMPO_DECIMAL")))
        tempo_str = _safe_str(row.get(column_map.get("TEMPO_DE_ATRASO")))

        # If total_min is 0 but we have text, parse it
        if total_min == 0 and tempo_str:
            total_min = int(parse_delay_text(tempo_str))

        # Datetime
        uc_col = column_map.get("ULTIMA_COMUNICACAO")
        ultima_comunicacao = None
        comm_hour = None
        if uc_col and pd.notna(row.get(uc_col)):
            p = parse_datetime(str(row[uc_col]))
            if p["date"]:
                try:
                    if p["hour"] is not None:
                        ultima_comunicacao = pd.to_datetime(f"{p['date']} {p['hour']:02d}:00:00")
                    else:
                        ultima_comunicacao = pd.to_datetime(p["date"])
                except Exception:
                    pass
            comm_hour = p["hour"]

        # Status, Risco, etc.
        status = _safe_str(row.get(column_map.get("STATUS")))
        score = _safe_int(row.get(column_map.get("SCORE")))
        risco = _safe_str(row.get(column_map.get("RISCO")))
        sla_ok = _safe_int(row.get(column_map.get("SLA_OK")))

        # DIA
        dia_col = column_map.get("DIA")
        dia = _safe_str(row.get(dia_col)) if dia_col else None
        dia_semana = DOW_SHORT.get(dia, dia) if dia else None
        if not dia_semana and ultima_comunicacao is not None:
            try:
                dia_semana = DOW_MAP.get(ultima_comunicacao.dayofweek)
            except Exception:
                pass

        periodo = _safe_str(row.get(column_map.get("PERIODO")))

        # FIM_SEMANA
        fs_col = column_map.get("FIM_SEMANA")
        fim_semana = False
        if fs_col and pd.notna(row.get(fs_col)):
            fv = str(row[fs_col]).strip().lower()
            fim_semana = fv in ("sim", "1", "true", "yes")

        acao = _safe_str(row.get(column_map.get("ACAO")))

        # CRITICO
        crit_col = column_map.get("CRITICO")
        critico = False
        if crit_col and pd.notna(row.get(crit_col)):
            cv = str(row[crit_col]).strip().upper()
            critico = cv in ("SIM", "1", "TRUE", "YES")

        score_final = _safe_float(row.get(column_map.get("SCORE_FINAL")))
        reincidencia = _safe_int(row.get(column_map.get("REINCIDENCIA")))
        rank_val = _safe_int(row.get(column_map.get("RANK"))) or None

        # Month from datetime
        mes = None
        if ultima_comunicacao is not None:
            try:
                mes = MONTH_MAP.get(ultima_comunicacao.month)
            except Exception:
                pass

        records.append({
            "source": source,
            "placa": placa,
            "categoria": categoria,
            "ultima_comunicacao": ultima_comunicacao,
            "tempo_de_atraso": tempo_str,
            "horas": horas,
            "minutos": minutos,
            "total_min": total_min,
            "tempo_decimal": tempo_decimal,
            "status": status,
            "score": score,
            "risco": risco,
            "sla_ok": sla_ok,
            "dia": dia,
            "dia_semana": dia_semana,
            "periodo": periodo,
            "fim_semana": fim_semana,
            "acao": acao,
            "critico": critico,
            "score_final": score_final,
            "reincidencia": reincidencia,
            "rank": rank_val,
            "hour": comm_hour,
            "mes": mes,
            "delay": float(total_min),
        })

    return pd.DataFrame(records) if records else pd.DataFrame()


def compute_kpis(df: pd.DataFrame) -> dict:
    """Compute KPIs from processed data."""
    if df is None or df.empty:
        return {"total": 0, "unique_plates": 0, "avg_delay": 0.0, "max_delay": 0.0,
                "max_delay_plate": "-", "avg_delay_formatted": "0m", "max_delay_formatted": "0m",
                "critical_count": 0, "sla_breach_count": 0, "reincidence_avg": 0.0}
    total = len(df)
    unique = df["placa"].nunique()
    delays = df[df["delay"] > 0]["delay"]
    avg_d = round(delays.mean(), 1) if len(delays) > 0 else 0.0
    max_d = round(delays.max(), 1) if len(delays) > 0 else 0.0
    max_p = df.loc[df["delay"].idxmax(), "placa"] if max_d > 0 else "-"

    critical_count = int(df["critico"].sum()) if "critico" in df.columns else 0
    sla_breach = int((df["sla_ok"] == 0).sum()) if "sla_ok" in df.columns else 0
    reincidence_avg = round(df["reincidencia"].mean(), 1) if "reincidencia" in df.columns and not df["reincidencia"].isna().all() else 0.0

    return {
        "total": total, "unique_plates": unique,
        "avg_delay": avg_d, "max_delay": max_d, "max_delay_plate": max_p,
        "avg_delay_formatted": format_minutes(avg_d), "max_delay_formatted": format_minutes(max_d),
        "critical_count": critical_count, "sla_breach_count": sla_breach,
        "reincidence_avg": reincidence_avg,
    }


def compute_hourly(df: pd.DataFrame) -> list[dict]:
    """Count records per hour 0-23."""
    counts = [0] * 24
    if df is not None and not df.empty and "hour" in df.columns:
        valid = df[df["hour"].notna()]
        for h in valid["hour"].astype(int):
            if 0 <= h < 24:
                counts[h] += 1
    return [{"hour": i, "label": f"{i:02d}h", "count": counts[i]} for i in range(24)]


def compute_ranking(df: pd.DataFrame, top_n: int = 8) -> pd.DataFrame:
    """Rank plates by total delay."""
    if df is None or df.empty:
        return pd.DataFrame()
    agg = df.groupby("placa").agg(
        count=("delay", "size"),
        total_delay=("delay", "sum"),
        avg_score=("score_final", "mean"),
        max_reincidencia=("reincidencia", "max"),
    ).reset_index()
    agg = agg.sort_values("total_delay", ascending=False).head(top_n).reset_index(drop=True)
    agg.index = agg.index + 1
    return agg


def compute_distribution(df: pd.DataFrame, column: str, order: list | None = None) -> list[dict]:
    """Count occurrences by a categorical column."""
    if df is None or df.empty or column not in df.columns:
        return []
    counts = df[column].dropna().value_counts()
    if order:
        counts = counts.reindex([o for o in order if o in counts.index]).dropna()
    return [{"label": str(k), "count": int(v)} for k, v in counts.items()]
