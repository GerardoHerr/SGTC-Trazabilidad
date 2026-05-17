from database.connection import engine
from sqlalchemy import text

columnas = [
    "ALTER TABLE semilla ADD COLUMN IF NOT EXISTS distribuidor VARCHAR",
    "ALTER TABLE semilla ADD COLUMN IF NOT EXISTS anexo_nombre VARCHAR",
    "ALTER TABLE semilla ADD COLUMN IF NOT EXISTS anexo_ruta VARCHAR",
    "ALTER TABLE semilla ADD COLUMN IF NOT EXISTS anexo_tamano INTEGER",
]

with engine.connect() as conn:
    for sql in columnas:
        conn.execute(text(sql))
        print(f"OK: {sql}")
    conn.commit()

print("\nMigración completada. Reinicia el backend.")