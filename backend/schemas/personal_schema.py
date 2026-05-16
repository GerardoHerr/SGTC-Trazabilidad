from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional
from models.Enums import RolTrabajador


class PersonalBase(BaseModel):
    nombres: str
    apellidos: str
    identificacion: str
    telefono: str
    rol: RolTrabajador

    @field_validator('telefono')
    @classmethod
    def telefono_numerico(cls, v: str) -> str:
        if not v.isdigit():
            raise ValueError('El teléfono debe ser numérico')
        return v


class PersonalCreate(PersonalBase):
    pass


class PersonalUpdate(BaseModel):
    nombres: Optional[str] = None
    apellidos: Optional[str] = None
    identificacion: Optional[str] = None
    telefono: Optional[str] = None
    rol: Optional[RolTrabajador] = None

    @field_validator('telefono')
    @classmethod
    def telefono_numerico(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not v.isdigit():
            raise ValueError('El teléfono debe ser numérico')
        return v


class PersonalResponse(PersonalBase):
    id: int
    fecha_creacion: datetime
    fecha_modificacion: datetime
    tiene_asignaciones_activas: bool = False

    class Config:
        from_attributes = True
