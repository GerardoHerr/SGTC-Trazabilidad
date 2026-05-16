from fastapi import FastAPI
from database.connection import engine, Base
from fastapi.middleware.cors import CORSMiddleware

from models.semilla import Semilla

from routes.semilla_routes import router as semilla_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(semilla_router)

@app.get("/")
def home():
    return {"message": "API funcionando"}