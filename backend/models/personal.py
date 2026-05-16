from sqlalchemy import Column, Integer, String, DateTime, Enum as SqlAlchemyEnum
from datetime import datetime
from database.connection import Base
from models.Enums import RolTrabajador


class Personal(Base):
    __tablename__ = "personal"

    id = Column(Integer, primary_key=True, index=True)
    nombres = Column(String, nullable=False)
    apellidos = Column(String, nullable=False)
    identificacion = Column(String, unique=True, nullable=False, index=True)
    telefono = Column(String, nullable=False)
    rol = Column(SqlAlchemyEnum(RolTrabajador), nullable=False)
    fecha_creacion = Column(DateTime, default=datetime.utcnow)
    fecha_modificacion = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
