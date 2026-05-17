from sqlalchemy import Column, Integer, DateTime, Enum as SqlAlchemyEnum, ForeignKey
from datetime import datetime
from database.connection import Base
from models.Enums import EstadoFase


class LoteFase(Base):
    __tablename__ = "lote_fase"

    id = Column(Integer, primary_key=True, index=True)
    lote_id = Column(Integer, ForeignKey("lote.id"), nullable=False, index=True)
    fase_id = Column(Integer, ForeignKey("fase.id"), nullable=False)
    fecha_inicio = Column(DateTime, nullable=False, default=datetime.utcnow)
    fecha_fin = Column(DateTime, nullable=True)
    estado = Column(SqlAlchemyEnum(EstadoFase), nullable=False, default=EstadoFase.EN_PROCESO)
