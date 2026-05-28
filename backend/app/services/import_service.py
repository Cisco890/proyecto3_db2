import json
import csv
import os
import shutil
from typing import Optional
from fastapi import UploadFile

from app.config import settings
from app.schemas.puzzle_schema import ImportResult
from app.services.validation_service import validate_puzzle, validate_pieces, validate_connections
from app.repositories.puzzle_repository import puzzle_repository


def _read_json(content: bytes) -> dict:
    """Parsea el contenido de un archivo JSON."""
    return json.loads(content.decode("utf-8"))


def _read_csv(content: bytes) -> list[dict]:
    """Parsea el contenido de un archivo CSV a lista de diccionarios."""
    text = content.decode("utf-8")
    lines = text.strip().splitlines()
    reader = csv.DictReader(lines)
    rows = []
    for row in reader:
        # Limpiar espacios en los valores
        cleaned = {k.strip(): v.strip() for k, v in row.items()}
        # Convertir campos numéricos y booleanos
        if "numero" in cleaned:
            try:
                cleaned["numero"] = int(cleaned["numero"])
            except (ValueError, TypeError):
                pass
        if "disponible" in cleaned:
            cleaned["disponible"] = cleaned["disponible"].lower() == "true"
        if "conexion_pieza1" in cleaned:
            try:
                cleaned["conexion_pieza1"] = int(cleaned["conexion_pieza1"])
            except (ValueError, TypeError):
                pass
        if "conexion_pieza2" in cleaned:
            try:
                cleaned["conexion_pieza2"] = int(cleaned["conexion_pieza2"])
            except (ValueError, TypeError):
                pass
        rows.append(cleaned)
    return rows


def _save_image(image: UploadFile, puzzle_id: str) -> str:
    """Guarda la imagen en uploads/puzzles/ y retorna la ruta relativa."""
    upload_dir = settings.UPLOAD_DIR
    os.makedirs(upload_dir, exist_ok=True)

    ext = os.path.splitext(image.filename)[1] if image.filename else ".jpg"
    filename = f"{puzzle_id}{ext}"
    filepath = os.path.join(upload_dir, filename)

    with open(filepath, "wb") as f:
        shutil.copyfileobj(image.file, f)

    return f"/{upload_dir}/{filename}"


async def import_puzzle_from_files(
    puzzle_file: UploadFile,
    pieces_file: UploadFile,
    connections_file: UploadFile,
    image_file: Optional[UploadFile] = None,
) -> ImportResult:
    """Flujo completo de importación: lee, valida y escribe en Neo4j."""

    warnings = []

    # 1. Leer archivos
    puzzle_content = await puzzle_file.read()
    pieces_content = await pieces_file.read()
    connections_content = await connections_file.read()

    puzzle_data = _read_json(puzzle_content)
    pieces_data = _read_csv(pieces_content)
    connections_data = _read_csv(connections_content)

    # 2. Guardar imagen si se proporcionó
    if image_file and image_file.filename:
        image_url = _save_image(image_file, puzzle_data.get("id", "puzzle"))
        puzzle_data["imagen_url"] = image_url

    # 3. Validar puzzle
    puzzle, puzzle_errors = validate_puzzle(puzzle_data)
    if puzzle_errors:
        raise ValueError("Errores en puzzle.json:\n" + "\n".join(puzzle_errors))

    # 4. Validar piezas
    valid_pieces, piece_errors = validate_pieces(pieces_data, puzzle.id)
    if piece_errors:
        warnings.extend(piece_errors)

    if not valid_pieces:
        raise ValueError("No se encontraron piezas válidas para importar.")

    # 5. Validar conexiones
    valid_piece_ids = {p.id for p in valid_pieces}
    valid_connections, conn_errors = validate_connections(connections_data, valid_piece_ids)
    if conn_errors:
        warnings.extend(conn_errors)

    # 6. Importar Puzzle en Neo4j
    puzzle_repository.create_or_update_puzzle(puzzle.model_dump())

    # 7. Importar Piezas y relaciones CONTIENE
    for piece in valid_pieces:
        puzzle_repository.create_or_update_piece(piece.model_dump())
        puzzle_repository.create_contains_relation(puzzle.id, piece.id)

    # 8. Importar Conexiones
    for conn in valid_connections:
        puzzle_repository.create_connection(
            pieza_origen=conn.pieza_origen,
            pieza_destino=conn.pieza_destino,
            conexion_pieza1=conn.conexion_pieza1,
            conexion_pieza2=conn.conexion_pieza2,
        )

    # 9. Retornar resumen
    return ImportResult(
        puzzle_id=puzzle.id,
        puzzle_imported=True,
        pieces_imported=len(valid_pieces),
        connections_imported=len(valid_connections),
        image_url=puzzle.imagen_url,
        warnings=warnings,
    )


def import_puzzle_from_data_dir() -> ImportResult:
    """Importa desde los archivos en el directorio data/ (para pruebas locales)."""
    import io

    data_dir = "data"

    # Leer puzzle.json
    with open(os.path.join(data_dir, "puzzle.json"), "r", encoding="utf-8") as f:
        puzzle_data = json.load(f)

    # Leer piezas.csv
    with open(os.path.join(data_dir, "piezas.csv"), "r", encoding="utf-8") as f:
        content = f.read()
    pieces_data = _read_csv(content.encode("utf-8"))

    # Leer conexiones.csv
    with open(os.path.join(data_dir, "conexiones.csv"), "r", encoding="utf-8") as f:
        content = f.read()
    connections_data = _read_csv(content.encode("utf-8"))

    warnings = []

    # Validar
    puzzle, puzzle_errors = validate_puzzle(puzzle_data)
    if puzzle_errors:
        raise ValueError("Errores en puzzle.json:\n" + "\n".join(puzzle_errors))

    valid_pieces, piece_errors = validate_pieces(pieces_data, puzzle.id)
    if piece_errors:
        warnings.extend(piece_errors)

    if not valid_pieces:
        raise ValueError("No se encontraron piezas válidas para importar.")

    valid_piece_ids = {p.id for p in valid_pieces}
    valid_connections, conn_errors = validate_connections(connections_data, valid_piece_ids)
    if conn_errors:
        warnings.extend(conn_errors)

    # Importar
    puzzle_repository.create_or_update_puzzle(puzzle.model_dump())

    for piece in valid_pieces:
        puzzle_repository.create_or_update_piece(piece.model_dump())
        puzzle_repository.create_contains_relation(puzzle.id, piece.id)

    for conn in valid_connections:
        puzzle_repository.create_connection(
            pieza_origen=conn.pieza_origen,
            pieza_destino=conn.pieza_destino,
            conexion_pieza1=conn.conexion_pieza1,
            conexion_pieza2=conn.conexion_pieza2,
        )

    return ImportResult(
        puzzle_id=puzzle.id,
        puzzle_imported=True,
        pieces_imported=len(valid_pieces),
        connections_imported=len(valid_connections),
        image_url=puzzle.imagen_url,
        warnings=warnings,
    )
