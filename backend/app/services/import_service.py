import json
import csv
import os
import re
import shutil
from typing import Optional
from fastapi import UploadFile

from app.config import settings
from app.errors import AppError, INVALID_FILE_FORMAT, IMPORT_VALIDATION_ERROR
from app.schemas.puzzle_schema import ImportResult
from app.services.validation_service import validate_puzzle, validate_pieces, validate_connections
from app.repositories.puzzle_repository import puzzle_repository

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def _read_json(content: bytes) -> dict:
    try:
        return json.loads(content.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError) as e:
        raise AppError(400, f"El archivo puzzle.json no es JSON válido: {e}", INVALID_FILE_FORMAT)


def _read_csv(content: bytes) -> list[dict]:
    try:
        text = content.decode("utf-8")
    except UnicodeDecodeError as e:
        raise AppError(400, f"El archivo CSV no tiene codificación UTF-8 válida: {e}", INVALID_FILE_FORMAT)

    lines = text.strip().splitlines()
    if not lines:
        raise AppError(400, "El archivo CSV está vacío.", INVALID_FILE_FORMAT)

    reader = csv.DictReader(lines)
    rows = []
    for row in reader:
        cleaned = {k.strip(): v.strip() for k, v in row.items()}
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


def _validate_pieces_headers(content: bytes) -> None:
    text = content.decode("utf-8", errors="ignore")
    first_line = text.strip().splitlines()[0] if text.strip() else ""
    headers = {h.strip() for h in first_line.split(",")}
    required = {"id", "numero", "disponible", "id_puzzle"}
    missing = required - headers
    if missing:
        raise AppError(
            400,
            f"El archivo piezas.csv no tiene los encabezados requeridos: {', '.join(missing)}.",
            INVALID_FILE_FORMAT,
        )


def _validate_connections_headers(content: bytes) -> None:
    text = content.decode("utf-8", errors="ignore")
    first_line = text.strip().splitlines()[0] if text.strip() else ""
    headers = {h.strip() for h in first_line.split(",")}
    required = {"pieza_origen", "pieza_destino", "conexion_pieza1", "conexion_pieza2"}
    missing = required - headers
    if missing:
        raise AppError(
            400,
            f"El archivo conexiones.csv no tiene los encabezados requeridos: {', '.join(missing)}.",
            INVALID_FILE_FORMAT,
        )


def _sanitize_filename(name: str) -> str:
    """Elimina caracteres peligrosos del nombre de archivo."""
    return re.sub(r"[^a-zA-Z0-9_\-]", "_", name)


def _save_image(image: UploadFile, puzzle_id: str) -> str:
    if not image.filename:
        raise AppError(400, "El archivo de imagen no tiene nombre.", INVALID_FILE_FORMAT)

    ext = os.path.splitext(image.filename)[1].lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise AppError(
            400,
            f"Extensión de imagen no permitida: '{ext}'. "
            f"Se aceptan: {', '.join(ALLOWED_IMAGE_EXTENSIONS)}.",
            INVALID_FILE_FORMAT,
        )

    upload_dir = settings.UPLOAD_DIR
    os.makedirs(upload_dir, exist_ok=True)

    safe_id = _sanitize_filename(puzzle_id)
    filename = f"{safe_id}{ext}"
    filepath = os.path.join(upload_dir, filename)

    with open(filepath, "wb") as f:
        shutil.copyfileobj(image.file, f)

    return f"/uploads/puzzles/{filename}"


async def import_puzzle_from_files(
    puzzle_file: UploadFile,
    pieces_file: UploadFile,
    connections_file: UploadFile,
    image_file: Optional[UploadFile] = None,
) -> ImportResult:
    warnings = []

    puzzle_content = await puzzle_file.read()
    pieces_content = await pieces_file.read()
    connections_content = await connections_file.read()

    _validate_pieces_headers(pieces_content)
    _validate_connections_headers(connections_content)

    puzzle_data = _read_json(puzzle_content)
    pieces_data = _read_csv(pieces_content)
    connections_data = _read_csv(connections_content)

    if image_file and image_file.filename:
        image_url = _save_image(image_file, puzzle_data.get("id", "puzzle"))
        puzzle_data["imagen_url"] = image_url

    puzzle, puzzle_errors = validate_puzzle(puzzle_data)
    if puzzle_errors:
        raise AppError(
            400,
            "Errores en puzzle.json: " + "; ".join(puzzle_errors),
            IMPORT_VALIDATION_ERROR,
        )

    valid_pieces, piece_errors = validate_pieces(pieces_data, puzzle.id)
    if piece_errors:
        warnings.extend(piece_errors)

    if not valid_pieces:
        raise AppError(400, "No se encontraron piezas válidas para importar.", IMPORT_VALIDATION_ERROR)

    valid_piece_ids = {p.id for p in valid_pieces}
    valid_connections, conn_errors = validate_connections(connections_data, valid_piece_ids)
    if conn_errors:
        warnings.extend(conn_errors)

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


def import_puzzle_from_data_dir(data_dir: str = "data") -> ImportResult:
    warnings = []

    with open(os.path.join(data_dir, "puzzle.json"), "r", encoding="utf-8") as f:
        puzzle_data = json.load(f)

    with open(os.path.join(data_dir, "piezas.csv"), "r", encoding="utf-8") as f:
        pieces_content = f.read().encode("utf-8")

    with open(os.path.join(data_dir, "conexiones.csv"), "r", encoding="utf-8") as f:
        connections_content = f.read().encode("utf-8")

    _validate_pieces_headers(pieces_content)
    _validate_connections_headers(connections_content)

    pieces_data = _read_csv(pieces_content)
    connections_data = _read_csv(connections_content)

    puzzle, puzzle_errors = validate_puzzle(puzzle_data)
    if puzzle_errors:
        raise AppError(
            400,
            "Errores en puzzle.json: " + "; ".join(puzzle_errors),
            IMPORT_VALIDATION_ERROR,
        )

    valid_pieces, piece_errors = validate_pieces(pieces_data, puzzle.id)
    if piece_errors:
        warnings.extend(piece_errors)

    if not valid_pieces:
        raise AppError(400, "No se encontraron piezas válidas para importar.", IMPORT_VALIDATION_ERROR)

    valid_piece_ids = {p.id for p in valid_pieces}
    valid_connections, conn_errors = validate_connections(connections_data, valid_piece_ids)
    if conn_errors:
        warnings.extend(conn_errors)

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
