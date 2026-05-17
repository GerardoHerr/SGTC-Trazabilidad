from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from database.connection import get_db
from models.lote import Lote
from models.fase import Fase
from models.lote_fase import LoteFase
from models.personal import Personal
from models.trabajador_lote_fase import TrabajadorLoteFase
from models.Enums import EstadoLote, EstadoFase, RolTrabajador
from schemas.fase_schema import IniciarEtapaRequest, LoteFaseResponse, TrabajadorEnFaseResponse

router = APIRouter(prefix="/lotes", tags=["Fases"])


@router.post("/{lote_id}/iniciar-etapa", response_model=LoteFaseResponse, status_code=201)
def iniciar_etapa(lote_id: int, body: IniciarEtapaRequest, db: Session = Depends(get_db)):
    lote = db.query(Lote).filter(Lote.id == lote_id).first()
    if not lote:
        raise HTTPException(status_code=404, detail="Lote no encontrado")

    if lote.estado != EstadoLote.CREADO:
        raise HTTPException(
            status_code=400,
            detail=f"Solo se puede iniciar etapa en lotes con estado 'Creado'. Estado actual: {lote.estado}"
        )

    if not body.trabajadores_ids:
        raise HTTPException(status_code=400, detail="Debe seleccionar al menos un trabajador")

    # Validar que los trabajadores existen y son AGRICULTOR
    for pid in body.trabajadores_ids:
        p = db.query(Personal).filter(Personal.id == pid).first()
        if not p:
            raise HTTPException(status_code=404, detail=f"Trabajador {pid} no encontrado")
        if p.rol != RolTrabajador.AGRICULTOR:
            raise HTTPException(status_code=400, detail=f"{p.nombres} no tiene rol Agricultor")

    # Obtener la fase inicial (SEMBRADO, orden=1)
    fase = db.query(Fase).filter(Fase.orden == 1).first()
    if not fase:
        raise HTTPException(status_code=500, detail="Fases no inicializadas en la base de datos")

    # Asignar semilla y cambiar estado del lote
    lote.semilla_id = body.semilla_id
    lote.estado = EstadoLote.EN_PRODUCCION

    # Crear registro en lote_fase
    lote_fase = LoteFase(
        lote_id=lote_id,
        fase_id=fase.id,
        fecha_inicio=datetime.utcnow(),
        estado=EstadoFase.EN_PROCESO,
    )
    db.add(lote_fase)
    db.flush()  # obtener lote_fase.id

    # Crear registros en trabajador_lote_fase
    for pid in body.trabajadores_ids:
        tlf = TrabajadorLoteFase(personal_id=pid, lote_fase_id=lote_fase.id)
        db.add(tlf)

    db.commit()
    db.refresh(lote_fase)

    # Construir respuesta
    trabajadores = (
        db.query(Personal)
        .join(TrabajadorLoteFase, TrabajadorLoteFase.personal_id == Personal.id)
        .filter(TrabajadorLoteFase.lote_fase_id == lote_fase.id)
        .all()
    )

    return LoteFaseResponse(
        id=lote_fase.id,
        lote_id=lote_fase.lote_id,
        fase_id=fase.id,
        fase_nombre=fase.nombre,
        fase_orden=fase.orden,
        fecha_inicio=lote_fase.fecha_inicio,
        fecha_fin=lote_fase.fecha_fin,
        estado=lote_fase.estado,
        trabajadores=[
            TrabajadorEnFaseResponse(
                id=t.id, nombres=t.nombres, apellidos=t.apellidos, rol=t.rol
            )
            for t in trabajadores
        ],
    )


@router.get("/{lote_id}/fases", response_model=List[LoteFaseResponse])
def listar_fases_lote(lote_id: int, db: Session = Depends(get_db)):
    lote = db.query(Lote).filter(Lote.id == lote_id).first()
    if not lote:
        raise HTTPException(status_code=404, detail="Lote no encontrado")

    lote_fases = (
        db.query(LoteFase)
        .filter(LoteFase.lote_id == lote_id)
        .order_by(LoteFase.fecha_inicio)
        .all()
    )

    result = []
    for lf in lote_fases:
        fase = db.query(Fase).filter(Fase.id == lf.fase_id).first()
        trabajadores = (
            db.query(Personal)
            .join(TrabajadorLoteFase, TrabajadorLoteFase.personal_id == Personal.id)
            .filter(TrabajadorLoteFase.lote_fase_id == lf.id)
            .all()
        )
        result.append(
            LoteFaseResponse(
                id=lf.id,
                lote_id=lf.lote_id,
                fase_id=lf.fase_id,
                fase_nombre=fase.nombre if fase else "Desconocida",
                fase_orden=fase.orden if fase else 0,
                fecha_inicio=lf.fecha_inicio,
                fecha_fin=lf.fecha_fin,
                estado=lf.estado,
                trabajadores=[
                    TrabajadorEnFaseResponse(
                        id=t.id, nombres=t.nombres, apellidos=t.apellidos, rol=t.rol
                    )
                    for t in trabajadores
                ],
            )
        )
    return result
