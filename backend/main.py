from fastapi import FastAPI
from database.connection import engine, Base
from fastapi.middleware.cors import CORSMiddleware

from models.semilla import Semilla
from models.personal import Personal
from models.parcela import Parcela
from models.catalogo import CatalogoOpcion

from routes.semilla_routes import router as semilla_router
from routes.personal_routes import router as personal_router
from routes.parcela_routes import router as parcela_router
from routes.catalogo_routes import router as catalogo_router

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

app.include_router(semilla_router)
app.include_router(personal_router)
app.include_router(parcela_router)
app.include_router(catalogo_router)

@app.get("/")
def home():
    return {"message": "API funcionando"}