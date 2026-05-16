from sqlalchemy import Column, Integer, String, Enum as SqlAlchemyEnum
from database.connection import Base
# Importamos los enums del archivo anterior
from models.Enums import (
    VariedadCafe, MetodoSecado, 
    MetodoSeleccion, OlorSemilla, ColorPergamino, IntegridadPergamino
)

class Semilla(Base):
    __tablename__ = "semilla"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Variedad es obligatorio (nullable=False) según tu código original
    variedad = Column(SqlAlchemyEnum(VariedadCafe), nullable=False)
    
    # Los demás atributos con sus respectivos Enums
    origen = Column(String, nullable=True)
    metodo_secado = Column(SqlAlchemyEnum(MetodoSecado), nullable=True)
    seleccion = Column(SqlAlchemyEnum(MetodoSeleccion), nullable=True)
    olor = Column(SqlAlchemyEnum(OlorSemilla), nullable=True)
    color = Column(SqlAlchemyEnum(ColorPergamino), nullable=True)
    integridad_pergamino = Column(SqlAlchemyEnum(IntegridadPergamino), nullable=True)

