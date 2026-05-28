from pydantic import BaseModel, field_validator
from typing import List, Optional


class PuzzleSchema(BaseModel):
    """Esquema para validar los datos del puzzle desde puzzle.json."""

    id: str
    nombre: str
    tematica: str
    total_piezas: int
    imagen_url: str

    @field_validator("id", "nombre", "tematica", "imagen_url")
    @classmethod
    def not_empty(cls, v: str, info) -> str:
        if not v or not v.strip():
            raise ValueError(f"El campo '{info.field_name}' no puede estar vacío.")
        return v.strip()

    @field_validator("total_piezas")
    @classmethod
    def total_piezas_positive(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("total_piezas debe ser un entero mayor a 0.")
        return v


class PieceSchema(BaseModel):
    """Esquema para validar los datos de una pieza desde piezas.csv."""

    id: str
    numero: int
    disponible: bool
    id_puzzle: str

    @field_validator("id", "id_puzzle")
    @classmethod
    def not_empty(cls, v: str, info) -> str:
        if not v or not v.strip():
            raise ValueError(f"El campo '{info.field_name}' no puede estar vacío.")
        return v.strip()


class ConnectionSchema(BaseModel):
    """Esquema para validar los datos de una conexión desde conexiones.csv."""

    pieza_origen: str
    pieza_destino: str
    conexion_pieza1: int
    conexion_pieza2: int

    @field_validator("pieza_origen", "pieza_destino")
    @classmethod
    def not_empty(cls, v: str, info) -> str:
        if not v or not v.strip():
            raise ValueError(f"El campo '{info.field_name}' no puede estar vacío.")
        return v.strip()


class ImportResult(BaseModel):
    """Esquema para la respuesta del proceso de importación."""

    puzzle_id: str
    puzzle_imported: bool
    pieces_imported: int
    connections_imported: int
    image_url: str
    warnings: List[str] = []
