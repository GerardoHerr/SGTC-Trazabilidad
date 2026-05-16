from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.connection import SessionLocal
from models.semilla import Semilla
from schemas.semilla_schema import (
    SemillaCreate,
    SemillaResponse
)

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/semillas", response_model=SemillaResponse)
def crear_semilla(semilla: SemillaCreate, db: Session = Depends(get_db)):
    nueva_semilla = Semilla(
        variedad=semilla.variedad,
        origen=semilla.origen,
        metodo_secado=semilla.metodo_secado,
        seleccion=semilla.seleccion,
        olor=semilla.olor,
        color=semilla.color,
        integridad_pergamino=semilla.integridad_pergamino
    )

    db.add(nueva_semilla)
    db.commit()
    db.refresh(nueva_semilla)

    return nueva_semilla

@router.get("/semillas", response_model=list[SemillaResponse])
def listar_semillas(db: Session = Depends(get_db)):
    semillas = db.query(Semilla).all()
    return semillas