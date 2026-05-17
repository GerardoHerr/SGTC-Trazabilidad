#!/usr/bin/env python
"""
Script para inicializar la base de datos con todas las tablas y campos
Ejecutar: python init_db.py
"""

from database.connection import engine, Base
from models.semilla import Semilla
from models.personal import Personal
from models.parcela import Parcela

def init_db():
    """Crear todas las tablas en la base de datos"""
    print("Inicializando base de datos...")
    
    try:
        # Crear todas las tablas definidas en los modelos
        Base.metadata.create_all(bind=engine)
        print("✅ Base de datos inicializada exitosamente")
        print("✅ Tablas creadas: semilla, personal, parcela")
        
    except Exception as e:
        print(f"❌ Error al inicializar base de datos: {str(e)}")
        raise

if __name__ == "__main__":
    init_db()
