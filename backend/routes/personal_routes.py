from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import datetime
from typing import Optional, List

from database.connection import SessionLocal
from models.personal import Personal
from models.trabajador_lote_fase import TrabajadorLoteFase
from models.lote_fase import LoteFase
from models.lote import Lote
from models.fase import Fase
from models.Enums import RolTrabajador, EstadoFase
from schemas.personal_schema import PersonalCreate, PersonalUpdate, PersonalResponse
from schemas.fase_schema import AgricultorResponse

router = APIRouter(prefix="/personal", tags=["Personal"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/agricultores", response_model=List[AgricultorResponse])
def listar_agricultores(db: Session = Depends(get_db)):
    """Retorna todos los trabajadores con rol Agricultor e info de su lote/fase activa."""
    agricultores = (
        db.query(Personal)
        .filter(Personal.rol == RolTrabajador.AGRICULTOR)
        .order_by(Personal.apellidos)
        .all()
    )

    result = []
    for p in agricultores:
        # Buscar si tiene una lote_fase activa (EN_PROCESO)
        tlf = (
            db.query(TrabajadorLoteFase)
            .join(LoteFase, LoteFase.id == TrabajadorLoteFase.lote_fase_id)
            .filter(
                TrabajadorLoteFase.personal_id == p.id,
                LoteFase.estado == EstadoFase.EN_PROCESO,
            )
            .first()
        )

        lote_activo_id = None
        lote_activo_codigo = None
        fase_activa = None

        if tlf:
            lf = db.query(LoteFase).filter(LoteFase.id == tlf.lote_fase_id).first()
            if lf:
                lote = db.query(Lote).filter(Lote.id == lf.lote_id).first()
                fase = db.query(Fase).filter(Fase.id == lf.fase_id).first()
                lote_activo_id = lote.id if lote else None
                lote_activo_codigo = lote.codigo if lote else None
                fase_activa = fase.nombre if fase else None

        result.append(
            AgricultorResponse(
                id=p.id,
                nombres=p.nombres,
                apellidos=p.apellidos,
                rol=p.rol,
                lote_activo_id=lote_activo_id,
                lote_activo_codigo=lote_activo_codigo,
                fase_activa=fase_activa,
            )
        )
    return result


@router.get("/")
def listar_personal(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Personal)
    if search:
        query = query.filter(
            or_(
                Personal.nombres.ilike(f"%{search}%"),
                Personal.apellidos.ilike(f"%{search}%"),
                Personal.identificacion.ilike(f"%{search}%"),
            )
        )
    total = query.count()
    trabajadores = query.order_by(Personal.apellidos).offset(skip).limit(limit).all()
    return {
        "total": total,
        "trabajadores": [PersonalResponse.model_validate(t) for t in trabajadores],
    }


@router.get("/{id}", response_model=PersonalResponse)
def obtener_personal(id: int, db: Session = Depends(get_db)):
    trabajador = db.query(Personal).filter(Personal.id == id).first()
    if not trabajador:
        raise HTTPException(status_code=404, detail="Trabajador no encontrado")
    return trabajador


@router.post("/", response_model=PersonalResponse, status_code=201)
def crear_personal(datos: PersonalCreate, db: Session = Depends(get_db)):
    existente = db.query(Personal).filter(
        Personal.identificacion == datos.identificacion
    ).first()
    if existente:
        raise HTTPException(
            status_code=400, detail="La identificación ya está registrada"
        )
    trabajador = Personal(**datos.model_dump())
    db.add(trabajador)
    db.commit()
    db.refresh(trabajador)
    return trabajador


@router.put("/{id}", response_model=PersonalResponse)
def actualizar_personal(id: int, datos: PersonalUpdate, db: Session = Depends(get_db)):
    trabajador = db.query(Personal).filter(Personal.id == id).first()
    if not trabajador:
        raise HTTPException(status_code=404, detail="Trabajador no encontrado")

    update_data = datos.model_dump(exclude_unset=True)

    if (
        "identificacion" in update_data
        and update_data["identificacion"] != trabajador.identificacion
    ):
        # TODO: agregar verificación de asignaciones activas cuando exista la tabla Lotes
        duplicado = db.query(Personal).filter(
            Personal.identificacion == update_data["identificacion"]
        ).first()
        if duplicado:
            raise HTTPException(
                status_code=400, detail="La identificación ya está registrada"
            )

    for key, value in update_data.items():
        setattr(trabajador, key, value)

    trabajador.fecha_modificacion = datetime.utcnow()
    db.commit()
    db.refresh(trabajador)
    return trabajador


@router.delete("/{id}", status_code=204)
def eliminar_personal(id: int, db: Session = Depends(get_db)):
    trabajador = db.query(Personal).filter(Personal.id == id).first()
    if not trabajador:
        raise HTTPException(status_code=404, detail="Trabajador no encontrado")
    db.delete(trabajador)
    db.commit()
