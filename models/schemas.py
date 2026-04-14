"""Pydantic models for API response schemas."""

from __future__ import annotations
from pydantic import BaseModel


class DataStatus(BaseModel):
    security_loaded: bool = False
    telemetry_loaded: bool = False
    security_rows: int = 0
    telemetry_rows: int = 0


class KPIs(BaseModel):
    total: int = 0
    unique_plates: int = 0
    avg_delay: float = 0.0
    max_delay: float = 0.0
    max_delay_plate: str = "-"
    avg_delay_formatted: str = "0m"
    max_delay_formatted: str = "0m"
    critical_count: int = 0
    sla_breach_count: int = 0
    reincidence_avg: float = 0.0


class HourlyPoint(BaseModel):
    hour: int
    label: str
    count: int


class HourlyVolume(BaseModel):
    data: list[HourlyPoint] = []


class RankingEntry(BaseModel):
    rank: int
    placa: str
    count: int
    total_delay: float
    total_delay_formatted: str
    sources: list[str] = []
    pct: float = 0.0
    avg_score: float = 0.0
    max_reincidencia: int = 0


class RankingResponse(BaseModel):
    items: list[RankingEntry] = []


class TableRow(BaseModel):
    placa: str
    sources: list[str]
    count: int
    total_delay_formatted: str
    status: str = ""
    risco: str = ""
    acao: str = ""
    reincidencia: int = 0


class TableResponse(BaseModel):
    rows: list[TableRow] = []


class DistributionEntry(BaseModel):
    label: str
    count: int


class DistributionResponse(BaseModel):
    data: list[DistributionEntry] = []


class DashboardResponse(BaseModel):
    status: DataStatus
    kpis_security: KPIs | None = None
    kpis_telemetry: KPIs | None = None
    combined_unique_plates: int = 0
    combined_total_rows: int = 0
    hourly_security: HourlyVolume = HourlyVolume()
    hourly_telemetry: HourlyVolume = HourlyVolume()
    ranking: RankingResponse = RankingResponse()
    table: TableResponse = TableResponse()
    dist_dow: DistributionResponse = DistributionResponse()
    dist_month: DistributionResponse = DistributionResponse()
    dist_status: DistributionResponse = DistributionResponse()
    dist_risco: DistributionResponse = DistributionResponse()
    dist_periodo: DistributionResponse = DistributionResponse()
    dist_acao: DistributionResponse = DistributionResponse()
    dist_categoria: DistributionResponse = DistributionResponse()
