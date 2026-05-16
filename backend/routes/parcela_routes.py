from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional

from database.connection import SessionLocal
from models.parcela import Parcela
from models.Enums import EstadoParcela, TipoTerreno
from schemas.parcela_schema import ParcelaCreate, ParcelaUpdate, ParcelaResponse

router = APIRouter(prefix="/parcelas", tags=["Parcelas"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/")
def listar_parcelas(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    estado: Optional[EstadoParcela] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Parcela)
    if search:
        query = query.filter(Parcela.codigo.ilike(f"%{search}%"))
    if estado:
        query = query.filter(Parcela.estado == estado)
    total = query.count()
    parcelas = query.order_by(Parcela.codigo).offset(skip).limit(limit).all()
    return {
        "total": total,
        "parcelas": [ParcelaResponse.model_validate(p) for p in parcelas],
    }


@router.get("/{id}", response_model=ParcelaResponse)
def obtener_parcela(id: int, db: Session = Depends(get_db)):
    parcela = db.query(Parcela).filter(Parcela.id == id).first()
    if not parcela:
        raise HTTPException(status_code=404, detail="Parcela no encontrada")
    return parcela


@router.post("/", response_model=ParcelaResponse, status_code=201)
def crear_parcela(datos: ParcelaCreate, db: Session = Depends(get_db)):
    existente = db.query(Parcela).filter(Parcela.codigo == datos.codigo).first()
    if existente:
        raise HTTPException(
            status_code=400, detail="El código de parcela ya está registrado"
        )
    parcela = Parcela(**datos.model_dump())
    db.add(parcela)
    db.commit()
    db.refresh(parcela)
    return parcela


@router.put("/{id}", response_model=ParcelaResponse)
def actualizar_parcela(id: int, datos: ParcelaUpdate, db: Session = Depends(get_db)):
    parcela = db.query(Parcela).filter(Parcela.id == id).first()
    if not parcela:
        raise HTTPException(status_code=404, detail="Parcela no encontrada")

    update_data = datos.model_dump(exclude_unset=True)

    # Validar cantidad de zonas coherente con tipo_terreno resultante
    nuevo_terreno = update_data.get("tipo_terreno", parcela.tipo_terreno)
    nueva_zona = update_data.get("tipo_zona", parcela.tipo_zona)
    if nueva_zona is not None:
        if nuevo_terreno == TipoTerreno.REGULAR and len(nueva_zona) != 1:
            raise HTTPException(
                status_code=400,
                detail="Para terreno Regular, selecciona exactamente 1 tipo de zona",
            )
        if nuevo_terreno != TipoTerreno.REGULAR and (len(nueva_zona) < 2 or len(nueva_zona) > 4):
            raise HTTPException(
                status_code=400,
                detail="Para terreno Irregular, selecciona entre 2 y 4 tipos de zona",
            )

    for key, value in update_data.items():
        setattr(parcela, key, value)

    parcela.fecha_modificacion = datetime.utcnow()
    db.commit()
    db.refresh(parcela)
    return parcela


@router.delete("/{id}", status_code=204)
def eliminar_parcela(id: int, db: Session = Depends(get_db)):
    parcela = db.query(Parcela).filter(Parcela.id == id).first()
    if not parcela:
        raise HTTPException(status_code=404, detail="Parcela no encontrada")
    db.delete(parcela)
    db.commit()
