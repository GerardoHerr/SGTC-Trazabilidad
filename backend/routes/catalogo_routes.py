from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from database.connection import get_db
from models.catalogo import CatalogoOpcion
from schemas.catalogo_schema import OpcionCreate

router = APIRouter(prefix="/catalogos", tags=["Catálogos"])


@router.get("/{categoria}", response_model=List[str])
def listar_opciones(categoria: str, db: Session = Depends(get_db)):
    opciones = (
        db.query(CatalogoOpcion)
        .filter(CatalogoOpcion.categoria == categoria)
        .order_by(CatalogoOpcion.valor)
        .all()
    )
    return [o.valor for o in opciones]


@router.post("/{categoria}", response_model=List[str], status_code=201)
def agregar_opcion(categoria: str, body: OpcionCreate, db: Session = Depends(get_db)):
    existente = (
        db.query(CatalogoOpcion)
        .filter(
            CatalogoOpcion.categoria == categoria,
            CatalogoOpcion.valor == body.valor,
        )
        .first()
    )
    if not existente:
        opcion = CatalogoOpcion(categoria=categoria, valor=body.valor)
        db.add(opcion)
        db.commit()

    todas = (
        db.query(CatalogoOpcion)
        .filter(CatalogoOpcion.categoria == categoria)
        .order_by(CatalogoOpcion.valor)
        .all()
    )
    return [o.valor for o in todas]
