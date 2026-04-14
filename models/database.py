"""SQLAlchemy database models — mirrors Supabase 'records' table."""

from sqlalchemy import Column, BigInteger, Integer, SmallInteger, String, Float, Boolean, DateTime, Index
from sqlalchemy.orm import declarative_base
from datetime import datetime, timezone

Base = declarative_base()


class Record(Base):
    __tablename__ = "records"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    source = Column(String(20), nullable=False)
    placa = Column(String(20), nullable=False)
    categoria = Column(String(50), nullable=True)
    ultima_comunicacao = Column(DateTime, nullable=True)
    tempo_de_atraso = Column(String(50), nullable=True)
    horas = Column(Integer, default=0)
    minutos = Column(Integer, default=0)
    total_min = Column(Integer, default=0)
    tempo_decimal = Column(Float, default=0.0)
    status = Column(String(30), nullable=True)
    score = Column(Integer, default=0)
    risco = Column(String(20), nullable=True)
    sla_ok = Column(SmallInteger, default=0)
    dia = Column(String(5), nullable=True)
    periodo = Column(String(10), nullable=True)
    fim_semana = Column(Boolean, default=False)
    acao = Column(String(50), nullable=True)
    critico = Column(Boolean, default=False)
    score_final = Column(Float, default=0.0)
    reincidencia = Column(Integer, default=0)
    rank = Column(Integer, nullable=True)
    file_name = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        Index("idx_records_source", "source"),
        Index("idx_records_placa", "placa"),
        Index("idx_records_status", "status"),
        Index("idx_records_risco", "risco"),
        Index("idx_records_categoria", "categoria"),
        Index("idx_records_dia", "dia"),
        Index("idx_records_periodo", "periodo"),
    )
