from sqlalchemy import Column, Integer, String, Float, DateTime, Enum as SqlAlchemyEnum, ForeignKey
from datetime import datetime
from database.connection import Base
from models.Enums import EstadoLote, TipoZona


class Lote(Base):
    __tablename__ = "lote"

    id = Column(Integer, primary_key=True, index=True)
    parcela_id = Column(Integer, ForeignKey("parcela.id"), nullable=False, index=True)
    codigo = Column(String, unique=True, nullable=False, index=True)  # Ej: A1, B2, C3
    numero_lote = Column(Integer, nullable=False)  # 1, 2, 3...
    estado = Column(SqlAlchemyEnum(EstadoLote), nullable=False, default=EstadoLote.CREADO)
    hectareas_asignadas = Column(Float, nullable=False)
    tipo_zona = Column(SqlAlchemyEnum(TipoZona), nullable=True)  # Para parcelas irregulares
    semilla_id = Column(Integer, ForeignKey("semilla.id"), nullable=True, index=True)
    fecha_creacion = Column(DateTime, default=datetime.utcnow)
    fecha_modificacion = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
