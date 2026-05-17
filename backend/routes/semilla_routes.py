from fastapi import APIRouter, Depends, UploadFile, File, Request
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import os
import json
from datetime import datetime
from pathlib import Path

from database.connection import SessionLocal
from models.semilla import Semilla
from models.Enums import (
    VariedadCafe, MetodoSecado, 
    MetodoSeleccion, OlorSemilla, ColorPergamino, IntegridadPergamino
)
from schemas.semilla_schema import (
    SemillaCreate,
    SemillaResponse
)

router = APIRouter()

# Crear carpeta de uploads si no existe
UPLOAD_FOLDER = "uploads/semillas"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Extensiones permitidas
ALLOWED_EXTENSIONS = {'.pdf', '.csv', '.jpg', '.jpeg', '.png'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def allowed_file(filename):
    """Validar extensión de archivo"""
    ext = Path(filename).suffix.lower()
    return ext in ALLOWED_EXTENSIONS

@router.post("/semillas", response_model=SemillaResponse)
async def crear_semilla(
    request: Request,
    db: Session = Depends(get_db)
):
    """Crear una nueva semilla con anexo opcional"""
    
    try:
        # Leer los datos multipart
        form_data = await request.form()
        
        # Obtener valores del formulario
        variedad = form_data.get("variedad", "")
        origen = form_data.get("origen", "")
        metodo_secado = form_data.get("metodo_secado", "")
        seleccion = form_data.get("seleccion", "")
        olor = form_data.get("olor", "")
        color = form_data.get("color", "")
        integridad_pergamino = form_data.get("integridad_pergamino", "")
        
        if not variedad or not origen:
            raise ValueError("Variedad y origen son requeridos")
        
        anexo_nombre = None
        anexo_ruta = None
        anexo_tamano = None
        
        # Obtener archivo si existe
        anexo = form_data.get("anexo")
        if anexo:
            # Validar extensión
            if not allowed_file(anexo.filename):
                raise ValueError(f"Formato de archivo no permitido. Solo se aceptan: PDF, CSV, JPG, PNG")
            
            # Leer contenido del archivo
            file_content = await anexo.read()
            
            # Validar tamaño
            if len(file_content) > MAX_FILE_SIZE:
                raise ValueError(f"El archivo supera el tamaño máximo permitido (5MB)")
            
            # Crear nombre único para el archivo
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            file_ext = Path(anexo.filename).suffix
            unique_filename = f"semilla_{timestamp}{file_ext}"
            file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
            
            # Guardar archivo
            with open(file_path, 'wb') as f:
                f.write(file_content)
            
            anexo_nombre = anexo.filename
            anexo_ruta = file_path
            anexo_tamano = len(file_content)
        
        # Convertir strings a enums
        try:
            # Convertir valores a mayúscula para que coincidan con los nombres del enum
            variedad_key = variedad.upper().replace(' ', '_') if variedad else 'CATURRA'
            metodo_secado_key = 'MARQUESINAS' if metodo_secado == 'Secado en marquesinas del sol' else 'SOMBRA_CAMAS' if metodo_secado else None
            seleccion_key = 'MANUAL' if seleccion == 'Clasificación manual grano a grano' else 'FLOTACION_CRIBADO' if seleccion else None
            
            variedad_enum = VariedadCafe[variedad_key] if variedad_key else VariedadCafe.CATURRA
            metodo_secado_enum = MetodoSecado[metodo_secado_key] if metodo_secado_key else None
            seleccion_enum = MetodoSeleccion[seleccion_key] if seleccion_key else None
            
            # Para los otros campos, buscar por valor
            olor_enum = None
            if olor:
                for item in OlorSemilla:
                    if item.value == olor:
                        olor_enum = item
                        break
            
            color_enum = None
            if color:
                for item in ColorPergamino:
                    if item.value == color:
                        color_enum = item
                        break
            
            integridad_enum = None
            if integridad_pergamino:
                for item in IntegridadPergamino:
                    if item.value == integridad_pergamino:
                        integridad_enum = item
                        break
        except (KeyError, IndexError) as e:
            raise ValueError(f"Valor de enumeración inválido: {str(e)}")
        
        # Crear nueva semilla
        nueva_semilla = Semilla(
            variedad=variedad_enum,
            origen=origen,
            metodo_secado=metodo_secado_enum,
            seleccion=seleccion_enum,
            olor=olor_enum,
            color=color_enum,
            integridad_pergamino=integridad_enum,
            anexo_nombre=anexo_nombre,
            anexo_ruta=anexo_ruta,
            anexo_tamano=anexo_tamano
        )

        db.add(nueva_semilla)
        db.commit()
        db.refresh(nueva_semilla)

        return nueva_semilla
    
    except Exception as e:
        db.rollback()
        raise ValueError(f"Error al crear semilla: {str(e)}")

@router.get("/semillas", response_model=list[SemillaResponse])
def listar_semillas(db: Session = Depends(get_db)):
    semillas = db.query(Semilla).all()
    return semillas

@router.get("/semillas/{semilla_id}/anexo")
def descargar_anexo(semilla_id: int, db: Session = Depends(get_db)):
    """Descargar archivo adjunto de una semilla"""
    
    try:
        # Obtener la semilla
        semilla = db.query(Semilla).filter(Semilla.id == semilla_id).first()
        if not semilla:
            raise ValueError("Semilla no encontrada")
        
        if not semilla.anexo_ruta:
            raise ValueError("Esta semilla no tiene archivo adjunto")
        
        # Verificar que el archivo existe
        if not os.path.exists(semilla.anexo_ruta):
            raise ValueError("El archivo no existe")
        
        # Retornar el archivo con el nombre original
        return FileResponse(
            path=semilla.anexo_ruta,
            filename=semilla.anexo_nombre,
            media_type='application/octet-stream'
        )
    
    except Exception as e:
        raise ValueError(f"Error al descargar archivo: {str(e)}")