from fastapi import FastAPI
from database.connection import engine, Base
from fastapi.middleware.cors import CORSMiddleware

from models.semilla import Semilla
from models.personal import Personal
from models.parcela import Parcela

from routes.semilla_routes import router as semilla_router
from routes.personal_routes import router as personal_router
from routes.parcela_routes import router as parcela_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(semilla_router)
app.include_router(personal_router)
app.include_router(parcela_router)

@app.get("/")
def home():
    return {"message": "API funcionando"}