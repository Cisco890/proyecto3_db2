import pytest
from app.services.validation_service import validate_puzzle, validate_pieces, validate_connections


# ---------------------------------------------------------------------------
# validate_puzzle
# ---------------------------------------------------------------------------

def test_validate_puzzle_valid():
    data = {
        "id": "puzzle_001",
        "nombre": "Test",
        "tematica": "Naturaleza",
        "total_piezas": 6,
        "imagen_url": "/uploads/puzzles/puzzle_001.jpg",
    }
    puzzle, errors = validate_puzzle(data)
    assert puzzle is not None
    assert errors == []


def test_validate_puzzle_missing_id():
    data = {
        "nombre": "Test",
        "tematica": "Naturaleza",
        "total_piezas": 6,
        "imagen_url": "/uploads/puzzles/puzzle_001.jpg",
    }
    puzzle, errors = validate_puzzle(data)
    assert puzzle is None
    assert len(errors) > 0


def test_validate_puzzle_empty_id():
    data = {
        "id": "  ",
        "nombre": "Test",
        "tematica": "Naturaleza",
        "total_piezas": 6,
        "imagen_url": "/uploads/puzzles/puzzle_001.jpg",
    }
    puzzle, errors = validate_puzzle(data)
    assert puzzle is None
    assert any("id" in e for e in errors)


def test_validate_puzzle_invalid_total_piezas_zero():
    data = {
        "id": "puzzle_001",
        "nombre": "Test",
        "tematica": "Naturaleza",
        "total_piezas": 0,
        "imagen_url": "/uploads/puzzles/puzzle_001.jpg",
    }
    puzzle, errors = validate_puzzle(data)
    assert puzzle is None
    assert len(errors) > 0


def test_validate_puzzle_invalid_total_piezas_negative():
    data = {
        "id": "puzzle_001",
        "nombre": "Test",
        "tematica": "Naturaleza",
        "total_piezas": -3,
        "imagen_url": "/uploads/puzzles/puzzle_001.jpg",
    }
    puzzle, errors = validate_puzzle(data)
    assert puzzle is None
    assert len(errors) > 0


def test_validate_puzzle_invalid_total_piezas_string():
    data = {
        "id": "puzzle_001",
        "nombre": "Test",
        "tematica": "Naturaleza",
        "total_piezas": "seis",
        "imagen_url": "/uploads/puzzles/puzzle_001.jpg",
    }
    puzzle, errors = validate_puzzle(data)
    assert puzzle is None
    assert len(errors) > 0


# ---------------------------------------------------------------------------
# validate_pieces
# ---------------------------------------------------------------------------

def _base_pieces():
    return [
        {"id": "p1", "numero": 1, "disponible": True, "id_puzzle": "puzzle_001"},
        {"id": "p2", "numero": 2, "disponible": False, "id_puzzle": "puzzle_001"},
        {"id": "p3", "numero": 3, "disponible": True, "id_puzzle": "puzzle_001"},
    ]


def test_validate_pieces_valid():
    pieces, errors = validate_pieces(_base_pieces(), "puzzle_001")
    assert len(pieces) == 3
    assert errors == []


def test_validate_pieces_duplicate_id():
    data = _base_pieces()
    data.append({"id": "p1", "numero": 4, "disponible": True, "id_puzzle": "puzzle_001"})
    pieces, errors = validate_pieces(data, "puzzle_001")
    assert len(pieces) == 3
    assert any("duplicado" in e for e in errors)


def test_validate_pieces_duplicate_numero():
    data = _base_pieces()
    data.append({"id": "p4", "numero": 1, "disponible": True, "id_puzzle": "puzzle_001"})
    pieces, errors = validate_pieces(data, "puzzle_001")
    assert len(pieces) == 3
    assert any("duplicado" in e for e in errors)


def test_validate_pieces_wrong_puzzle_id():
    data = [{"id": "p1", "numero": 1, "disponible": True, "id_puzzle": "otro_puzzle"}]
    pieces, errors = validate_pieces(data, "puzzle_001")
    assert pieces == []
    assert len(errors) > 0


def test_validate_pieces_missing_required_field():
    data = [{"numero": 1, "disponible": True, "id_puzzle": "puzzle_001"}]
    pieces, errors = validate_pieces(data, "puzzle_001")
    assert pieces == []
    assert len(errors) > 0


def test_validate_pieces_numero_negativo():
    data = [{"id": "p1", "numero": -1, "disponible": True, "id_puzzle": "puzzle_001"}]
    pieces, errors = validate_pieces(data, "puzzle_001")
    assert pieces == []
    assert len(errors) > 0


# ---------------------------------------------------------------------------
# validate_connections
# ---------------------------------------------------------------------------

def _base_connections():
    return [
        {"pieza_origen": "p1", "pieza_destino": "p2", "conexion_pieza1": 1, "conexion_pieza2": 2},
        {"pieza_origen": "p2", "pieza_destino": "p3", "conexion_pieza1": 3, "conexion_pieza2": 1},
    ]


def test_validate_connections_valid():
    valid_ids = {"p1", "p2", "p3"}
    conns, errors = validate_connections(_base_connections(), valid_ids)
    assert len(conns) == 2
    assert errors == []


def test_validate_connections_missing_piece():
    data = [{"pieza_origen": "p1", "pieza_destino": "p99", "conexion_pieza1": 1, "conexion_pieza2": 2}]
    conns, errors = validate_connections(data, {"p1", "p2", "p3"})
    assert conns == []
    assert len(errors) > 0


def test_validate_connections_self_connection():
    data = [{"pieza_origen": "p1", "pieza_destino": "p1", "conexion_pieza1": 1, "conexion_pieza2": 2}]
    conns, errors = validate_connections(data, {"p1", "p2"})
    assert conns == []
    assert len(errors) > 0


def test_validate_connections_duplicate():
    data = _base_connections() + [_base_connections()[0]]
    conns, errors = validate_connections(data, {"p1", "p2", "p3"})
    assert len(conns) == 2
    assert any("duplicada" in e for e in errors)


def test_validate_connections_missing_required_field():
    data = [{"pieza_origen": "p1", "conexion_pieza1": 1, "conexion_pieza2": 2}]
    conns, errors = validate_connections(data, {"p1", "p2"})
    assert conns == []
    assert len(errors) > 0
