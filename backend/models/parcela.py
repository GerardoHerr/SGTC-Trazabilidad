from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, JSON, Enum as SqlAlchemyEnum
from datetime import datetime
from database.connection import Base
from models.Enums import (
    EstadoParcela, TipoTerreno, TexturaSuelo, OrientacionLadera
)


class Parcela(Base):
    __tablename__ = "parcela"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String, unique=True, nullable=False, index=True)
    hectareas = Column(Float, nullable=False)
    estado = Column(SqlAlchemyEnum(EstadoParcela), nullable=False, default=EstadoParcela.LIBRE)
    tipo_terreno = Column(SqlAlchemyEnum(TipoTerreno), nullable=False)
    # Lista de zonas: 1 para Regular, 2-4 para Irregular (almacenado como JSON)
    tipo_zona = Column(JSON, nullable=False)
    # Solo para Irregular: {zona_nombre: hectareas} - almacenado como JSON
    zonas_hectareas = Column(JSON, nullable=True)
    # Características técnicas
    ubicacion = Column(String, nullable=True)
    ph_suelo = Column(Float, nullable=False)
    textura = Column(SqlAlchemyEnum(TexturaSuelo), nullable=False)
    orientacion_ladera = Column(SqlAlchemyEnum(OrientacionLadera), nullable=False)
    altitud_msnm = Column(Float, nullable=False)
    cortinas_rompevientos = Column(Boolean, nullable=False, default=False)
    fecha_creacion = Column(DateTime, default=datetime.utcnow)
    fecha_modificacion = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
