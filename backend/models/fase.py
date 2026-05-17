from sqlalchemy import Column, Integer, Enum as SqlAlchemyEnum
from database.connection import Base
from models.Enums import NombreFase


class Fase(Base):
    __tablename__ = "fase"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(SqlAlchemyEnum(NombreFase), unique=True, nullable=False)
    orden = Column(Integer, nullable=False)
