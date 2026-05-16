from pydantic import BaseModel
from typing import Optional
from models.Enums import (
    VariedadCafe, MetodoSecado, 
    MetodoSeleccion, OlorSemilla, ColorPergamino, IntegridadPergamino
)

class SemillaCafeBase(BaseModel):
    variedad: VariedadCafe  # Obligatorio
    origen: Optional[str] = None
    metodo_secado: Optional[MetodoSecado] = None
    seleccion: Optional[MetodoSeleccion] = None
    olor: Optional[OlorSemilla] = None
    color: Optional[ColorPergamino] = None
    integridad_pergamino: Optional[IntegridadPergamino] = None

class SemillaCreate(SemillaCafeBase):
    pass

class SemillaResponse(SemillaCafeBase):
    id: int

    class Config:
        from_attributes = True  # Permite mapear modelos de SQLAlchemy a Pydantic