import asyncio
import io
import pytest
from unittest.mock import patch, MagicMock

from app.errors import AppError
from app.services.import_service import import_puzzle_from_files


PUZZLE_JSON = b"""{
  "id": "puzzle_test",
  "nombre": "Puzzle de prueba",
  "tematica": "Test",
  "total_piezas": 3,
  "imagen_url": "/uploads/puzzles/puzzle_test.jpg"
}"""

PIECES_CSV = b"""id,numero,disponible,id_puzzle
p1,1,true,puzzle_test
p2,2,false,puzzle_test
p3,3,true,puzzle_test
"""

CONNECTIONS_CSV = b"""pieza_origen,pieza_destino,conexion_pieza1,conexion_pieza2
p1,p3,2,1
"""


class MockUploadFile:
    def __init__(self, content: bytes, filename: str = "archivo"):
        self.filename = filename
        self._content = content

    async def read(self) -> bytes:
        return self._content

    @property
    def file(self):
        return io.BytesIO(self._content)


def _mock_repo():
    repo = MagicMock()
    repo.create_or_update_puzzle.return_value = None
    repo.create_or_update_piece.return_value = None
    repo.create_contains_relation.return_value = None
    repo.create_connection.return_value = None
    return repo


# ---------------------------------------------------------------------------
# Importación válida completa
# ---------------------------------------------------------------------------

def test_import_valid_complete():
    mock_repo = _mock_repo()
    with patch("app.services.import_service.puzzle_repository", mock_repo):
        result = asyncio.run(
            import_puzzle_from_files(
                puzzle_file=MockUploadFile(PUZZLE_JSON, "puzzle.json"),
                pieces_file=MockUploadFile(PIECES_CSV, "piezas.csv"),
                connections_file=MockUploadFile(CONNECTIONS_CSV, "conexiones.csv"),
            )
        )
    assert result.puzzle_id == "puzzle_test"
    assert result.puzzle_imported is True
    assert result.pieces_imported == 3
    assert result.connections_imported == 1


def test_import_calls_repo_merge():
    mock_repo = _mock_repo()
    with patch("app.services.import_service.puzzle_repository", mock_repo):
        asyncio.run(
            import_puzzle_from_files(
                puzzle_file=MockUploadFile(PUZZLE_JSON, "puzzle.json"),
                pieces_file=MockUploadFile(PIECES_CSV, "piezas.csv"),
                connections_file=MockUploadFile(CONNECTIONS_CSV, "conexiones.csv"),
            )
        )
    assert mock_repo.create_or_update_puzzle.call_count == 1
    assert mock_repo.create_or_update_piece.call_count == 3
    assert mock_repo.create_contains_relation.call_count == 3
    assert mock_repo.create_connection.call_count == 1


def test_import_repeated_calls_repo_again():
    """Segunda importación con mismos datos vuelve a llamar al repo (MERGE en Neo4j evita duplicados)."""
    mock_repo = _mock_repo()
    with patch("app.services.import_service.puzzle_repository", mock_repo):
        for _ in range(2):
            asyncio.run(
                import_puzzle_from_files(
                    puzzle_file=MockUploadFile(PUZZLE_JSON, "puzzle.json"),
                    pieces_file=MockUploadFile(PIECES_CSV, "piezas.csv"),
                    connections_file=MockUploadFile(CONNECTIONS_CSV, "conexiones.csv"),
                )
            )
    assert mock_repo.create_or_update_puzzle.call_count == 2


# ---------------------------------------------------------------------------
# Archivos inválidos
# ---------------------------------------------------------------------------

def test_import_invalid_json():
    with pytest.raises(AppError) as exc_info:
        asyncio.run(
            import_puzzle_from_files(
                puzzle_file=MockUploadFile(b"esto no es json", "puzzle.json"),
                pieces_file=MockUploadFile(PIECES_CSV, "piezas.csv"),
                connections_file=MockUploadFile(CONNECTIONS_CSV, "conexiones.csv"),
            )
        )
    assert exc_info.value.code == "INVALID_FILE_FORMAT"


def test_import_puzzle_json_missing_field():
    bad_json = b'{"nombre": "Test", "tematica": "X", "total_piezas": 3, "imagen_url": "/img.jpg"}'
    with pytest.raises(AppError) as exc_info:
        asyncio.run(
            import_puzzle_from_files(
                puzzle_file=MockUploadFile(bad_json, "puzzle.json"),
                pieces_file=MockUploadFile(PIECES_CSV, "piezas.csv"),
                connections_file=MockUploadFile(CONNECTIONS_CSV, "conexiones.csv"),
            )
        )
    assert exc_info.value.code == "IMPORT_VALIDATION_ERROR"


def test_import_pieces_csv_missing_header():
    bad_csv = b"id,numero,id_puzzle\np1,1,puzzle_test\n"
    with pytest.raises(AppError) as exc_info:
        asyncio.run(
            import_puzzle_from_files(
                puzzle_file=MockUploadFile(PUZZLE_JSON, "puzzle.json"),
                pieces_file=MockUploadFile(bad_csv, "piezas.csv"),
                connections_file=MockUploadFile(CONNECTIONS_CSV, "conexiones.csv"),
            )
        )
    assert exc_info.value.code == "INVALID_FILE_FORMAT"


def test_import_connections_csv_missing_header():
    bad_csv = b"pieza_origen,pieza_destino,conexion_pieza1\np1,p3,2\n"
    with pytest.raises(AppError) as exc_info:
        asyncio.run(
            import_puzzle_from_files(
                puzzle_file=MockUploadFile(PUZZLE_JSON, "puzzle.json"),
                pieces_file=MockUploadFile(PIECES_CSV, "piezas.csv"),
                connections_file=MockUploadFile(bad_csv, "conexiones.csv"),
            )
        )
    assert exc_info.value.code == "INVALID_FILE_FORMAT"


def test_import_empty_pieces_csv():
    with pytest.raises(AppError) as exc_info:
        asyncio.run(
            import_puzzle_from_files(
                puzzle_file=MockUploadFile(PUZZLE_JSON, "puzzle.json"),
                pieces_file=MockUploadFile(b"", "piezas.csv"),
                connections_file=MockUploadFile(CONNECTIONS_CSV, "conexiones.csv"),
            )
        )
    assert exc_info.value.code == "INVALID_FILE_FORMAT"


def test_import_invalid_image_extension():
    mock_repo = _mock_repo()
    with patch("app.services.import_service.puzzle_repository", mock_repo):
        with pytest.raises(AppError) as exc_info:
            asyncio.run(
                import_puzzle_from_files(
                    puzzle_file=MockUploadFile(PUZZLE_JSON, "puzzle.json"),
                    pieces_file=MockUploadFile(PIECES_CSV, "piezas.csv"),
                    connections_file=MockUploadFile(CONNECTIONS_CSV, "conexiones.csv"),
                    image_file=MockUploadFile(b"data", "malware.exe"),
                )
            )
    assert exc_info.value.code == "INVALID_FILE_FORMAT"


def test_import_warns_on_invalid_piece_rows():
    pieces_mixed = b"""id,numero,disponible,id_puzzle
p1,1,true,puzzle_test
p_bad,,true,puzzle_test
p2,2,true,puzzle_test
"""
    mock_repo = _mock_repo()
    with patch("app.services.import_service.puzzle_repository", mock_repo):
        result = asyncio.run(
            import_puzzle_from_files(
                puzzle_file=MockUploadFile(PUZZLE_JSON, "puzzle.json"),
                pieces_file=MockUploadFile(pieces_mixed, "piezas.csv"),
                connections_file=MockUploadFile(CONNECTIONS_CSV, "conexiones.csv"),
            )
        )
    assert result.pieces_imported == 2
    assert len(result.warnings) > 0
