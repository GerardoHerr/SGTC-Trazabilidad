from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from database.connection import get_db
from models.lote import Lote
from models.parcela import Parcela
from schemas.lote_schema import LoteCreate, LoteResponse, LoteUpdate
from models.Enums import EstadoLote, TipoTerreno
from typing import Optional

router = APIRouter(prefix="/lotes", tags=["lotes"])


@router.post("/", response_model=list[LoteResponse])
def crear_lotes(lote_data: LoteCreate, db: Session = Depends(get_db)):
    try:
        parcela = db.query(Parcela).filter(Parcela.id == lote_data.parcela_id).first()
        if not parcela:
            raise HTTPException(status_code=404, detail="Parcela no encontrada")

        if lote_data.cantidad_lotes < 1:
            raise HTTPException(status_code=400, detail="La cantidad de lotes debe ser mayor a 0")

        if len(lote_data.distribuciones) != lote_data.cantidad_lotes:
            raise HTTPException(
                status_code=400,
                detail=f"Se esperaban {lote_data.cantidad_lotes} distribuciones"
            )

        # Calcular hectáreas ya asignadas (todos los lotes de esta parcela, cualquier estado)
        hectareas_ya = db.query(
            func.coalesce(func.sum(Lote.hectareas_asignadas), 0.0)
        ).filter(Lote.parcela_id == lote_data.parcela_id).scalar() or 0.0
        disponibles = round(parcela.hectareas - hectareas_ya, 4)

        if disponibles <= 0:
            raise HTTPException(
                status_code=400,
                detail=f"Esta parcela no tiene espacio disponible. "
                       f"Total: {parcela.hectareas} ha — Ocupadas: {hectareas_ya:.2f} ha"
            )

        # Mínimo 1 ha por lote para terreno regular
        if parcela.tipo_terreno == TipoTerreno.REGULAR:
            for i, dist in enumerate(lote_data.distribuciones, 1):
                if dist.hectareas < 1.0:
                    raise HTTPException(
                        status_code=400,
                        detail=f"El lote {i} tiene {dist.hectareas} ha. "
                               f"Cada lote debe tener mínimo 1 hectárea."
                    )

        # Validar que la suma no supere el espacio disponible
        total_nuevo = sum(d.hectareas for d in lote_data.distribuciones)
        if total_nuevo > disponibles + 0.001:
            raise HTTPException(
                status_code=400,
                detail=f"Las hectáreas solicitadas ({total_nuevo:.2f} ha) superan "
                       f"el espacio disponible ({disponibles:.2f} ha)"
            )

        # Parcelas irregulares deben especificar tipo_zona
        if parcela.tipo_terreno == TipoTerreno.IRREGULAR:
            for dist in lote_data.distribuciones:
                if not dist.tipo_zona:
                    raise HTTPException(
                        status_code=400,
                        detail="Para parcelas irregulares debe especificarse el tipo de zona"
                    )

        # Código único por parcela: {parcela.codigo}-L{n}
        # Evita colisiones globales entre parcelas distintas
        lotes_previos = db.query(Lote).filter(Lote.parcela_id == lote_data.parcela_id).count()
        lotes_creados = []
        for i, distribucion in enumerate(lote_data.distribuciones, 1):
            seq = lotes_previos + i
            codigo = f"{parcela.codigo}-L{seq}"
            nuevo_lote = Lote(
                parcela_id=lote_data.parcela_id,
                codigo=codigo,
                numero_lote=seq,
                estado=EstadoLote.CREADO,
                hectareas_asignadas=distribucion.hectareas,
                tipo_zona=distribucion.tipo_zona
            )
            db.add(nuevo_lote)
            lotes_creados.append(nuevo_lote)

        db.commit()
        for lote in lotes_creados:
            db.refresh(lote)
        return lotes_creados

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error al crear lotes: {str(e)}")


@router.get("/", response_model=list[LoteResponse])
def listar_lotes(
    parcela_id: Optional[int] = None,
    estado: Optional[EstadoLote] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Lote)

    if parcela_id:
        query = query.filter(Lote.parcela_id == parcela_id)

    if estado:
        query = query.filter(Lote.estado == estado)
    else:
        # Por defecto: lotes activos (excluye Completado y Archivado)
        query = query.filter(
            Lote.estado.in_([EstadoLote.CREADO, EstadoLote.EN_PROCESO, EstadoLote.EN_PRODUCCION])
        )

    return query.order_by(Lote.fecha_creacion.desc()).all()


@router.get("/{lote_id}", response_model=LoteResponse)
def obtener_lote(lote_id: int, db: Session = Depends(get_db)):
    lote = db.query(Lote).filter(Lote.id == lote_id).first()
    if not lote:
        raise HTTPException(status_code=404, detail="Lote no encontrado")
    return lote


@router.put("/{lote_id}", response_model=LoteResponse)
def actualizar_lote(lote_id: int, lote_data: LoteUpdate, db: Session = Depends(get_db)):
    lote = db.query(Lote).filter(Lote.id == lote_id).first()
    if not lote:
        raise HTTPException(status_code=404, detail="Lote no encontrado")

    if lote_data.semilla_id is not None:
        lote.semilla_id = lote_data.semilla_id
        lote.estado = EstadoLote.EN_PROCESO

    if lote_data.estado is not None:
        lote.estado = lote_data.estado

    db.commit()
    db.refresh(lote)
    return lote


@router.delete("/{lote_id}")
def eliminar_lote(lote_id: int, db: Session = Depends(get_db)):
    lote = db.query(Lote).filter(Lote.id == lote_id).first()
    if not lote:
        raise HTTPException(status_code=404, detail="Lote no encontrado")

    if lote.estado != EstadoLote.CREADO:
        raise HTTPException(
            status_code=400,
            detail=f"Solo se pueden eliminar lotes en estado 'Creado', este está en '{lote.estado}'"
        )

    db.delete(lote)
    db.commit()
    return {"mensaje": "Lote eliminado correctamente"}
