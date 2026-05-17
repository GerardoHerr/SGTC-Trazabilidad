from enum import Enum

# ── Parcela ──────────────────────────────────────────────
class EstadoParcela(str, Enum):
    LIBRE = "Libre"
    EN_PROCESO = "En Proceso"
    EN_PRODUCCION = "En Producción"

class TipoTerreno(str, Enum):
    REGULAR = "Regular"
    IRREGULAR = "Irregular"

class TipoZona(str, Enum):
    ZONA_PLANA = "Zona Plana"
    ZONA_INCLINADA = "Zona Inclinada"
    ZONA_BAJA = "Zona Baja"
    ZONA_ALTA = "Zona Alta"

class TexturaSuelo(str, Enum):
    FRANCO_ARENOSA = "Franco-arenosa"
    FRANCO_ARCILLOSA = "Franco-arcillosa"

class OrientacionLadera(str, Enum):
    NORTE = "Orientación al Norte"
    SUR = "Orientación al Sur"

# ── Personal ─────────────────────────────────────────────
class RolTrabajador(str, Enum):
    RECOLECTOR = "Recolector"
    FUMIGADOR = "Fumigador"
    OPERARIO = "Operario"
    SUPERVISOR = "Supervisor"
    CAPATAZ = "Capataz"

# ── Semilla ─────────────────────────────────────────────
class VariedadCafe(str, Enum):
    CATURRA = "Caturra"
    CASTILLO = "Castillo"
    GEISHA = "Geisha"
    BOURBON = "Bourbon"
    TIPICA = "Típica"

class MetodoSecado(str, Enum):
    MARQUESINAS = "Secado en marquesinas del sol"
    SOMBRA_CAMAS = "Secado lento a la sombra sobre camas africanas"

class MetodoSeleccion(str, Enum):
    MANUAL = "Clasificación manual grano a grano"
    FLOTACION_CRIBADO = "Flotación en agua y cribado mecánico por tamaño"

class OlorSemilla(str, Enum):
    FRESCO = "Fresco"
    HIERBA_SECA = "A hierba seca"
    PAJA_LIMPIA = "A paja limpia"
    MOHO = "A moho"
    FERMENTO = "A fermento"

class ColorPergamino(str, Enum):
    AMARILLO_PALIDO = "Amarillo pálido uniforme"
    CREMA_CLARO = "Crema claro"
    MARFIL = "Marfil"

class IntegridadPergamino(str, Enum):
    INTACTO_98 = "98% de granos con pergamino intacto"
    SIN_FISURAS = "Sin fisuras ni descascarillado visible"