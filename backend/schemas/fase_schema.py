from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from models.Enums import EstadoFase, NombreFase


class IniciarEtapaRequest(BaseModel):
    semilla_id: int
    trabajadores_ids: List[int]


class TrabajadorEnFaseResponse(BaseModel):
    id: int
    nombres: str
    apellidos: str
    rol: str

    class Config:
        from_attributes = True


class LoteFaseResponse(BaseModel):
    id: int
    lote_id: int
    fase_id: int
    fase_nombre: str
    fase_orden: int
    fecha_inicio: datetime
    fecha_fin: Optional[datetime] = None
    estado: EstadoFase
    trabajadores: List[TrabajadorEnFaseResponse] = []

    class Config:
        from_attributes = True


class AgricultorResponse(BaseModel):
    id: int
    nombres: str
    apellidos: str
    rol: str
    lote_activo_id: Optional[int] = None
    lote_activo_codigo: Optional[str] = None
    fase_activa: Optional[str] = None

    class Config:
        from_attributes = True
