"""Utility functions for text normalization, delay parsing, and formatting."""

import re
import unicodedata


def normalize_string(text: str) -> str:
    """Remove accents, trim, and uppercase for column matching."""
    text = str(text).strip().upper()
    nfkd = unicodedata.normalize("NFD", text)
    return "".join(c for c in nfkd if not unicodedata.combining(c))


def parse_delay_text(text: str) -> float:
    """Convert delay text like '74h e 36min' or '02:30' to minutes."""
    if not text:
        return 0.0
    s = str(text).lower().strip()

    total = 0.0
    h = re.search(r"(\d+)\s*h", s)
    m = re.search(r"(\d+)\s*m", s)
    if h:
        total += int(h.group(1)) * 60
    if m:
        total += int(m.group(1))
    if total > 0:
        return total

    colon = re.search(r"(\d+):(\d+)", s)
    if colon:
        return int(colon.group(1)) * 60 + int(colon.group(2))

    try:
        val = float(s.replace(",", "."))
        return max(val, 0.0)
    except ValueError:
        return 0.0


def parse_datetime(text: str) -> dict:
    """Parse a datetime string -> {'date': str|None, 'hour': int|None}."""
    if not text:
        return {"date": None, "hour": None}
    s = str(text).strip()

    hour = None
    hm = re.search(r"(?:\s|T|^)(\d{1,2})[:hH](\d{2})", s)
    if hm:
        h = int(hm.group(1))
        hour = h if 0 <= h <= 23 else None

    date_str = None
    dm = re.search(r"(\d{1,2})[/\-](\d{1,2})[/\-](\d{2,4})", s)
    if dm:
        p1, p2, p3 = dm.group(1), dm.group(2), dm.group(3)
        if len(p3) == 2:
            p3 = "20" + p3
        date_str = f"{p3}-{p2.zfill(2)}-{p1.zfill(2)}"
    else:
        rm = re.search(r"(\d{4})[/\-](\d{1,2})[/\-](\d{1,2})", s)
        if rm:
            date_str = f"{rm.group(1)}-{rm.group(2).zfill(2)}-{rm.group(3).zfill(2)}"

    return {"date": date_str, "hour": hour}


def format_minutes(minutes: float) -> str:
    """Format minutes into readable string like '2h 30m'."""
    if minutes < 60:
        return f"{round(minutes)}m"
    h = int(minutes // 60)
    m = round(minutes % 60)
    return f"{h}h {m}m" if m else f"{h}h"
