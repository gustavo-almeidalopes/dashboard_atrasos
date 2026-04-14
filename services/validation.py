"""Data validation for uploaded CSV files."""

import pandas as pd


def validate_dataframe(df: pd.DataFrame) -> dict:
    """
    Validate a DataFrame before processing.
    Returns a dict with 'errors' (critical) and 'warnings' (non-critical) lists.
    """
    errors = []
    warnings = []

    if df is None or df.empty:
        errors.append({
            "type": "empty_dataset",
            "message": "O arquivo está vazio ou não contém dados válidos.",
            "rows": [],
        })
        return {"errors": errors, "warnings": warnings}

    # Check for PLACA column
    has_placa = any("placa" in col.lower() for col in df.columns)
    if not has_placa:
        errors.append({
            "type": "missing_column",
            "column": "PLACA",
            "message": "Coluna 'PLACA' não encontrada. Esta coluna é obrigatória.",
            "rows": [],
        })
        return {"errors": errors, "warnings": warnings}

    # Find placa column
    placa_col = next((col for col in df.columns if "placa" in col.lower()), None)

    # Check for null placas
    null_placas = df[df[placa_col].isna() | (df[placa_col].astype(str).str.strip() == "")]
    if len(null_placas) > 0:
        sample = null_placas.head(5).index.tolist()
        warnings.append({
            "type": "null_placa",
            "message": f"{len(null_placas)} registro(s) com PLACA vazia serão ignorados.",
            "rows": sample,
            "additional": max(0, len(null_placas) - 5),
        })

    # Check for negative delays
    for col in df.columns:
        if any(kw in col.lower() for kw in ["atraso", "min", "horas"]):
            numeric = pd.to_numeric(df[col], errors="coerce")
            negative = df[numeric < 0]
            if len(negative) > 0:
                sample = negative.head(5).index.tolist()
                warnings.append({
                    "type": "negative_delay",
                    "column": col,
                    "message": f"{len(negative)} registro(s) com valor negativo na coluna '{col}'.",
                    "rows": sample,
                    "additional": max(0, len(negative) - 5),
                })

    return {"errors": errors, "warnings": warnings}
