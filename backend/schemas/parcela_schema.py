from pydantic import BaseModel, field_validator, model_validator
from datetime import datetime
from typing import Dict, List, Optional
from models.Enums import (
    EstadoParcela, TipoTerreno, TipoZona, TexturaSuelo, OrientacionLadera
)


class ParcelaBase(BaseModel):
    codigo: str
    # Regular: obligatorio. Irregular: se calcula de zonas_hectareas.
    hectareas: Optional[float] = None
    tipo_terreno: TipoTerreno
    # Regular → exactamente 1 zona  |  Irregular → 2 a 4 zonas
    tipo_zona: List[TipoZona]
    # Solo para irregular: {zona_nombre: hectareas}
    zonas_hectareas: Optional[Dict[str, float]] = None
    ubicacion: Optional[str] = None
    ph_suelo: float
    textura: TexturaSuelo
    orientacion_ladera: OrientacionLadera
    altitud_msnm: float
    cortinas_rompevientos: bool

    @field_validator('ph_suelo')
    @classmethod
    def ph_valido(cls, v: float) -> float:
        if v < 0 or v > 14:
            raise ValueError('El pH debe estar entre 0 y 14')
        return v

    @field_validator('altitud_msnm')
    @classmethod
    def altitud_valida(cls, v: float) -> float:
        if v < 0:
            raise ValueError('La altitud no puede ser un valor negativo')
        return v

    @field_validator('tipo_zona')
    @classmethod
    def zonas_sin_duplicados(cls, v: List[TipoZona]) -> List[TipoZona]:
        if len(v) != len(set(v)):
            raise ValueError('No puede haber zonas repetidas')
        return v

    @model_validator(mode='after')
    def validar_hectareas_y_zonas(self) -> 'ParcelaBase':
        zonas = self.tipo_zona

        if not zonas:
            raise ValueError('Debe seleccionar al menos una zona')

        if self.tipo_terreno == TipoTerreno.REGULAR:
            if len(zonas) != 1:
                raise ValueError('Para terreno Regular, selecciona exactamente 1 tipo de zona')
            if self.hectareas is None or self.hectareas <= 0:
                raise ValueError('El número de hectáreas es obligatorio para terreno Regular')

        else:  # IRREGULAR
            if len(zonas) < 2 or len(zonas) > 4:
                raise ValueError('Para terreno Irregular, selecciona entre 2 y 4 tipos de zona')
            if not self.zonas_hectareas:
                raise ValueError('Para terreno Irregular debe especificar las hectáreas de cada zona')
            # Verificar que cada zona seleccionada tiene su hectárea
            for zona in zonas:
                zona_str = zona.value if hasattr(zona, 'value') else str(zona)
                if zona_str not in self.zonas_hectareas:
                    raise ValueError(f'Falta especificar hectáreas para la zona: {zona_str}')
            # Mínimo 1 ha por zona
            for zona_str, ha in self.zonas_hectareas.items():
                if ha < 1:
                    raise ValueError(f'Mínimo 1 hectárea por zona ({zona_str})')
            # Calcular total
            self.hectareas = sum(self.zonas_hectareas.values())

        return self


class ParcelaCreate(ParcelaBase):
    pass


class ParcelaUpdate(BaseModel):
    """Código y altitud no son actualizables (HU-TL-20 CA-01)."""
    hectareas: Optional[float] = None
    estado: Optional[EstadoParcela] = None
    tipo_terreno: Optional[TipoTerreno] = None
    tipo_zona: Optional[List[TipoZona]] = None
    zonas_hectareas: Optional[Dict[str, float]] = None
    ubicacion: Optional[str] = None
    ph_suelo: Optional[float] = None
    textura: Optional[TexturaSuelo] = None
    orientacion_ladera: Optional[OrientacionLadera] = None
    cortinas_rompevientos: Optional[bool] = None

    @field_validator('ph_suelo')
    @classmethod
    def ph_valido(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and (v < 0 or v > 14):
            raise ValueError('El valor de pH modificado debe estar en el rango de 0 a 14')
        return v

    @field_validator('hectareas')
    @classmethod
    def hectareas_validas(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and v <= 0:
            raise ValueError('El número de hectáreas debe ser mayor a 0')
        return v

    @field_validator('tipo_zona')
    @classmethod
    def zonas_sin_duplicados(cls, v: Optional[List[TipoZona]]) -> Optional[List[TipoZona]]:
        if v is not None and len(v) != len(set(v)):
            raise ValueError('No puede haber zonas repetidas')
        return v


class ParcelaResponse(ParcelaBase):
    id: int
    estado: EstadoParcela
    fecha_creacion: datetime
    fecha_modificacion: datetime

    class Config:
        from_attributes = True
