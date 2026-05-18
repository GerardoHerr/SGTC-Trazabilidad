from fastapi import APIRouter, Depends, Request, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import os
from datetime import datetime
from pathlib import Path

from database.connection import SessionLocal
from models.semilla import Semilla
from models.Enums import (
    MetodoSecado,
    MetodoSeleccion, OlorSemilla, ColorPergamino, IntegridadPergamino
)
from schemas.semilla_schema import SemillaResponse

router = APIRouter()

UPLOAD_FOLDER = "uploads/semillas"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = {'.pdf', '.csv', '.jpg', '.jpeg', '.png'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _enum_by_value(enum_class, value):
    """Busca un miembro de enum por su valor; retorna None si no coincide."""
    if not value:
        return None
    try:
        return enum_class(value)
    except ValueError:
        return None


@router.post("/semillas", response_model=SemillaResponse)
async def crear_semilla(request: Request, db: Session = Depends(get_db)):
    try:
        form_data = await request.form()

        variedad_val = form_data.get("variedad", "")
        origen_val = form_data.get("origen", "")
        distribuidor_val = form_data.get("distribuidor", "") or None
        metodo_secado_val = form_data.get("metodo_secado", "")
        seleccion_val = form_data.get("seleccion", "")
        olor_val = form_data.get("olor", "")
        color_val = form_data.get("color", "")
        integridad_val = form_data.get("integridad_pergamino", "")

        if not variedad_val or not origen_val:
            raise HTTPException(status_code=400, detail="Variedad y origen son requeridos")

        metodo_secado_enum = _enum_by_value(MetodoSecado, metodo_secado_val)
        seleccion_enum = _enum_by_value(MetodoSeleccion, seleccion_val)
        olor_enum = _enum_by_value(OlorSemilla, olor_val)
        color_enum = _enum_by_value(ColorPergamino, color_val)
        integridad_enum = _enum_by_value(IntegridadPergamino, integridad_val)

        anexo_nombre = None
        anexo_ruta = None
        anexo_tamano = None

        anexo = form_data.get("anexo")
        if anexo and hasattr(anexo, "filename") and anexo.filename:
            ext = Path(anexo.filename).suffix.lower()
            if ext not in ALLOWED_EXTENSIONS:
                raise HTTPException(
                    status_code=400,
                    detail="Formato de archivo no permitido. Solo PDF, CSV, JPG o PNG."
                )
            file_content = await anexo.read()
            if len(file_content) > MAX_FILE_SIZE:
                raise HTTPException(status_code=400, detail="El archivo supera el límite de 5 MB")

            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            unique_filename = f"semilla_{timestamp}{ext}"
            file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
            with open(file_path, "wb") as f:
                f.write(file_content)

            anexo_nombre = anexo.filename
            anexo_ruta = file_path
            anexo_tamano = len(file_content)

        nueva_semilla = Semilla(
            variedad=variedad_val,
            origen=origen_val,
            distribuidor=distribuidor_val,
            metodo_secado=metodo_secado_enum,
            seleccion=seleccion_enum,
            olor=olor_enum,
            color=color_enum,
            integridad_pergamino=integridad_enum,
            anexo_nombre=anexo_nombre,
            anexo_ruta=anexo_ruta,
            anexo_tamano=anexo_tamano,
        )

        db.add(nueva_semilla)
        db.commit()
        db.refresh(nueva_semilla)
        return nueva_semilla

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error interno al crear semilla: {str(e)}")


@router.get("/semillas", response_model=list[SemillaResponse])
def listar_semillas(db: Session = Depends(get_db)):
    return db.query(Semilla).order_by(Semilla.fecha_creacion.desc()).all()


@router.get("/semillas/{semilla_id}", response_model=SemillaResponse)
def obtener_semilla(semilla_id: int, db: Session = Depends(get_db)):
    semilla = db.query(Semilla).filter(Semilla.id == semilla_id).first()
    if not semilla:
        raise HTTPException(status_code=404, detail="Semilla no encontrada")
    return semilla


@router.patch("/semillas/{semilla_id}/anexo", response_model=SemillaResponse)
async def actualizar_anexo_semilla(semilla_id: int, request: Request, db: Session = Depends(get_db)):
    semilla = db.query(Semilla).filter(Semilla.id == semilla_id).first()
    if not semilla:
        raise HTTPException(status_code=404, detail="Semilla no encontrada")
    form_data = await request.form()
    anexo = form_data.get("anexo")
    if not anexo or not hasattr(anexo, "filename") or not anexo.filename:
        raise HTTPException(status_code=400, detail="Se requiere un archivo adjunto")
    ext = Path(anexo.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Formato no permitido. Solo PDF, CSV, JPG o PNG.")
    file_content = await anexo.read()
    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="El archivo supera el límite de 5 MB")
    if semilla.anexo_ruta and os.path.exists(semilla.anexo_ruta):
        os.remove(semilla.anexo_ruta)
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    unique_filename = f"semilla_{timestamp}{ext}"
    file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
    with open(file_path, "wb") as f:
        f.write(file_content)
    semilla.anexo_nombre = anexo.filename
    semilla.anexo_ruta = file_path
    semilla.anexo_tamano = len(file_content)
    db.commit()
    db.refresh(semilla)
    return semilla


@router.get("/semillas/{semilla_id}/anexo")
def descargar_anexo(semilla_id: int, db: Session = Depends(get_db)):
    semilla = db.query(Semilla).filter(Semilla.id == semilla_id).first()
    if not semilla:
        raise HTTPException(status_code=404, detail="Semilla no encontrada")
    if not semilla.anexo_ruta or not os.path.exists(semilla.anexo_ruta):
        raise HTTPException(status_code=404, detail="Archivo adjunto no encontrado")
    return FileResponse(
        path=semilla.anexo_ruta,
        filename=semilla.anexo_nombre,
        media_type="application/octet-stream",
    )
