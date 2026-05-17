from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from models.Enums import EstadoLote, TipoZona


class DistribucionLote(BaseModel):
    numero_lote: int
    hectareas: float
    tipo_zona: Optional[TipoZona] = None


class LoteBase(BaseModel):
    parcela_id: int
    numero_lote: int
    hectareas_asignadas: float
    tipo_zona: Optional[TipoZona] = None


class LoteCreate(BaseModel):
    parcela_id: int
    cantidad_lotes: int
    distribuciones: List[DistribucionLote]  # Lista de lotes con sus hectáreas


class LoteUpdate(BaseModel):
    semilla_id: Optional[int] = None
    estado: Optional[EstadoLote] = None


class LoteResponse(LoteBase):
    id: int
    codigo: str
    estado: EstadoLote
    semilla_id: Optional[int] = None
    fecha_creacion: datetime
    fecha_modificacion: datetime

    class Config:
        from_attributes = True
