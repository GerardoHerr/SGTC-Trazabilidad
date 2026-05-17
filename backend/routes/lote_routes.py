from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.connection import get_db
from models.lote import Lote
from models.parcela import Parcela
from schemas.lote_schema import LoteCreate, LoteResponse, LoteUpdate
from models.Enums import EstadoLote, TipoTerreno
from typing import Optional
import string

router = APIRouter(prefix="/lotes", tags=["lotes"])

# Generar código de lote (A1, A2, B1, B2, etc.)
def generar_codigo_lote(parcela_id: int, numero_lote: int, db: Session) -> str:
    """Genera código único para el lote: A1, A2, B1, B2, etc."""
    # Contar cuántos lotes ya existen para esta parcela
    lotes_existentes = db.query(Lote).filter(Lote.parcela_id == parcela_id).count()
    # Letra basada en el número de grupos de 26 lotes
    letra_index = (lotes_existentes + numero_lote - 1) // 26
    letra = string.ascii_uppercase[min(letra_index, 25)]
    # Número secuencial
    numero = ((lotes_existentes + numero_lote - 1) % 26) + 1
    return f"{letra}{numero}"


@router.post("/", response_model=list[LoteResponse])
def crear_lotes(lote_data: LoteCreate, db: Session = Depends(get_db)):
    """
    Crear múltiples lotes asociados a una parcela
    
    CA-01: Valida campos obligatorios (cantidad de lotes y tipo de zona si es irregular)
    CA-02: Calcula automáticamente hectáreas promedio para parcelas regulares
    CA-03: Permite guardar distribución personalizada siempre que no exceda total
    CA-05: Valida información completa
    CA-06: Crea lotes con estado "Creado"
    """
    try:
        # Validar que la parcela existe
        parcela = db.query(Parcela).filter(Parcela.id == lote_data.parcela_id).first()
        if not parcela:
            raise HTTPException(status_code=404, detail="Parcela no encontrada")
        
        # Validar cantidad de lotes
        if lote_data.cantidad_lotes < 1:
            raise HTTPException(status_code=400, detail="La cantidad de lotes debe ser mayor a 0")
        
        if len(lote_data.distribuciones) != lote_data.cantidad_lotes:
            raise HTTPException(
                status_code=400,
                detail=f"Se esperaban {lote_data.cantidad_lotes} distribuciones"
            )
        
        # Validar suma total de hectáreas
        total_hectareas = sum(d.hectareas for d in lote_data.distribuciones)
        if total_hectareas > parcela.hectareas:
            raise HTTPException(
                status_code=400,
                detail=f"Suma de hectáreas ({total_hectareas}) excede disponibles ({parcela.hectareas})"
            )
        
        # Validar que para parcelas irregulares se especifique tipo_zona
        if parcela.tipo_terreno == TipoTerreno.IRREGULAR:
            for dist in lote_data.distribuciones:
                if not dist.tipo_zona:
                    raise HTTPException(
                        status_code=400,
                        detail="Para parcelas irregulares debe especificarse el tipo de zona"
                    )
        
        # Crear lotes
        lotes_creados = []
        for i, distribucion in enumerate(lote_data.distribuciones, 1):
            codigo = generar_codigo_lote(lote_data.parcela_id, i, db)
            
            nuevo_lote = Lote(
                parcela_id=lote_data.parcela_id,
                codigo=codigo,
                numero_lote=i,
                estado=EstadoLote.CREADO,
                hectareas_asignadas=distribucion.hectareas,
                tipo_zona=distribucion.tipo_zona
            )
            db.add(nuevo_lote)
            lotes_creados.append(nuevo_lote)
        
        db.commit()
        
        # Refrescar los lotes para obtener IDs generados
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
    """
    Listar lotes con filtros opcionales
    
    HU-TL-12 CA-01: Devuelve lotes en estado 'En Proceso' o 'Creado' (si no se especifica estado)
    HU-TL-12 CA-02: Incluye código identificador, estado y relación con semilla
    """
    query = db.query(Lote)
    
    if parcela_id:
        query = query.filter(Lote.parcela_id == parcela_id)
    
    if estado:
        query = query.filter(Lote.estado == estado)
    else:
        # Por defecto, mostrar lotes activos (excluye solo Completado y Archivado)
        query = query.filter(
            Lote.estado.in_([EstadoLote.CREADO, EstadoLote.EN_PROCESO, EstadoLote.EN_PRODUCCION])
        )
    
    lotes = query.order_by(Lote.fecha_creacion.desc()).all()
    return lotes


@router.get("/{lote_id}", response_model=LoteResponse)
def obtener_lote(lote_id: int, db: Session = Depends(get_db)):
    """Obtener un lote específico por ID"""
    lote = db.query(Lote).filter(Lote.id == lote_id).first()
    if not lote:
        raise HTTPException(status_code=404, detail="Lote no encontrado")
    return lote


@router.put("/{lote_id}", response_model=LoteResponse)
def actualizar_lote(lote_id: int, lote_data: LoteUpdate, db: Session = Depends(get_db)):
    """
    Actualizar un lote (semilla y/o estado)
    
    CA-07: Cambiar estado a 'En Proceso' cuando se registra la semilla
    """
    lote = db.query(Lote).filter(Lote.id == lote_id).first()
    if not lote:
        raise HTTPException(status_code=404, detail="Lote no encontrado")
    
    if lote_data.semilla_id is not None:
        lote.semilla_id = lote_data.semilla_id
        # Cambiar estado a En Proceso cuando se asigna semilla
        lote.estado = EstadoLote.EN_PROCESO
    
    if lote_data.estado is not None:
        lote.estado = lote_data.estado
    
    db.commit()
    db.refresh(lote)
    return lote


@router.delete("/{lote_id}")
def eliminar_lote(lote_id: int, db: Session = Depends(get_db)):
    """Eliminar un lote (solo si está en estado 'Creado')"""
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
