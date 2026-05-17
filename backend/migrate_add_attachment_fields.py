#!/usr/bin/env python
"""
Script para agregar las columnas de anexo a la tabla semilla
"""
import sqlalchemy as sa
from database.connection import engine

def migrate():
    with engine.connect() as connection:
        # Agregar columnas de anexo si no existen
        try:
            connection.execute(sa.text("""
                ALTER TABLE semilla 
                ADD COLUMN IF NOT EXISTS anexo_nombre VARCHAR(255),
                ADD COLUMN IF NOT EXISTS anexo_ruta VARCHAR(255),
                ADD COLUMN IF NOT EXISTS anexo_tamano INTEGER,
                ADD COLUMN IF NOT EXISTS fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            """))
            connection.commit()
            print("✓ Columnas de anexo agregadas exitosamente")
        except Exception as e:
            print(f"✗ Error al agregar columnas: {str(e)}")
            connection.rollback()

if __name__ == "__main__":
    migrate()
