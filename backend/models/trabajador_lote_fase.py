from sqlalchemy import Column, Integer, ForeignKey
from database.connection import Base


class TrabajadorLoteFase(Base):
    __tablename__ = "trabajador_lote_fase"

    id = Column(Integer, primary_key=True, index=True)
    personal_id = Column(Integer, ForeignKey("personal.id"), nullable=False, index=True)
    lote_fase_id = Column(Integer, ForeignKey("lote_fase.id"), nullable=False, index=True)
