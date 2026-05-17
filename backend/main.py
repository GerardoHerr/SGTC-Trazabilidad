from fastapi import FastAPI
from database.connection import engine, Base, SessionLocal
from fastapi.middleware.cors import CORSMiddleware

from models.semilla import Semilla
from models.personal import Personal
from models.parcela import Parcela
from models.catalogo import CatalogoOpcion
from models.lote import Lote
from models.fase import Fase
from models.lote_fase import LoteFase
from models.trabajador_lote_fase import TrabajadorLoteFase
from models.Enums import NombreFase

from routes.semilla_routes import router as semilla_router
from routes.personal_routes import router as personal_router
from routes.parcela_routes import router as parcela_router
from routes.catalogo_routes import router as catalogo_router
from routes.lote_routes import router as lote_router
from routes.fase_routes import router as fase_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8081",
        "http://localhost:8080",
        "http://127.0.0.1:8081",
        "http://127.0.0.1:8080",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["content-type", "authorization", "*"],
    max_age=3600,
)

Base.metadata.create_all(bind=engine)

# Seed fases si la tabla está vacía
def seed_fases():
    db = SessionLocal()
    try:
        if db.query(Fase).count() == 0:
            fases = [
                Fase(nombre=NombreFase.SEMBRADO, orden=1),
                Fase(nombre=NombreFase.COSECHA, orden=2),
                Fase(nombre=NombreFase.DESPULPADO, orden=3),
                Fase(nombre=NombreFase.SECADO, orden=4),
                Fase(nombre=NombreFase.TOSTADO, orden=5),
                Fase(nombre=NombreFase.MOLIDO, orden=6),
                Fase(nombre=NombreFase.EMPAQUETADO, orden=7),
                Fase(nombre=NombreFase.TRANSPORTE, orden=8),
            ]
            db.add_all(fases)
            db.commit()
    finally:
        db.close()

seed_fases()

app.include_router(semilla_router)
app.include_router(personal_router)
app.include_router(parcela_router)
app.include_router(catalogo_router)
app.include_router(lote_router)
app.include_router(fase_router)

@app.get("/")
def home():
    return {"message": "API funcionando"}
