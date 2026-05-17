from pydantic import BaseModel, field_validator


class OpcionCreate(BaseModel):
    valor: str

    @field_validator("valor")
    @classmethod
    def valor_no_vacio(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("El valor no puede estar vacío")
        return v
