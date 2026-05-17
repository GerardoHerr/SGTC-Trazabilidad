from sqlalchemy import Column, Integer, String, UniqueConstraint
from database.connection import Base


class CatalogoOpcion(Base):
    __tablename__ = "catalogo_opciones"

    id = Column(Integer, primary_key=True, index=True)
    categoria = Column(String, nullable=False, index=True)
    valor = Column(String, nullable=False)

    __table_args__ = (UniqueConstraint("categoria", "valor", name="uq_categoria_valor"),)
