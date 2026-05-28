from typing import List
from pydantic import ValidationError
from app.schemas.puzzle_schema import PuzzleSchema, PieceSchema, ConnectionSchema


def validate_puzzle(puzzle_data: dict) -> tuple[PuzzleSchema | None, List[str]]:
    """Valida los datos del puzzle.json. Retorna (schema, errores)."""
    errors = []
    try:
        puzzle = PuzzleSchema(**puzzle_data)
        return puzzle, errors
    except ValidationError as e:
        for err in e.errors():
            field = " -> ".join(str(loc) for loc in err["loc"])
            errors.append(f"Error en puzzle campo '{field}': {err['msg']}")
        return None, errors


def validate_pieces(pieces_data: list[dict], puzzle_id: str) -> tuple[List[PieceSchema], List[str]]:
    """Valida los datos de piezas.csv. Retorna (lista de schemas, errores)."""
    errors = []
    valid_pieces = []
    seen_ids = set()
    seen_numbers = set()

    for i, row in enumerate(pieces_data, start=1):
        # Validar con Pydantic
        try:
            piece = PieceSchema(**row)
        except ValidationError as e:
            for err in e.errors():
                field = " -> ".join(str(loc) for loc in err["loc"])
                errors.append(f"Fila {i} de piezas: error en campo '{field}': {err['msg']}")
            continue

        # Validar id_puzzle coincide con el puzzle importado
        if piece.id_puzzle != puzzle_id:
            errors.append(
                f"Fila {i}: la pieza '{piece.id}' tiene id_puzzle='{piece.id_puzzle}' "
                f"pero se esperaba '{puzzle_id}'."
            )
            continue

        # Validar id duplicado
        if piece.id in seen_ids:
            errors.append(f"Fila {i}: el id '{piece.id}' está duplicado en piezas.csv.")
            continue
        seen_ids.add(piece.id)

        # Validar número físico duplicado
        if piece.numero in seen_numbers:
            errors.append(
                f"Fila {i}: el número físico {piece.numero} está duplicado dentro del mismo puzzle."
            )
            continue
        seen_numbers.add(piece.numero)

        valid_pieces.append(piece)

    return valid_pieces, errors


def validate_connections(
    connections_data: list[dict], valid_piece_ids: set[str]
) -> tuple[List[ConnectionSchema], List[str]]:
    """Valida los datos de conexiones.csv. Retorna (lista de schemas, errores)."""
    errors = []
    valid_connections = []
    seen_connections = set()

    for i, row in enumerate(connections_data, start=1):
        # Validar con Pydantic
        try:
            conn = ConnectionSchema(**row)
        except ValidationError as e:
            for err in e.errors():
                field = " -> ".join(str(loc) for loc in err["loc"])
                errors.append(f"Fila {i} de conexiones: error en campo '{field}': {err['msg']}")
            continue

        # Validar que pieza_origen exista
        if conn.pieza_origen not in valid_piece_ids:
            errors.append(
                f"Fila {i}: la conexión {conn.pieza_origen} -> {conn.pieza_destino} "
                f"no se puede importar porque '{conn.pieza_origen}' no existe en piezas.csv."
            )
            continue

        # Validar que pieza_destino exista
        if conn.pieza_destino not in valid_piece_ids:
            errors.append(
                f"Fila {i}: la conexión {conn.pieza_origen} -> {conn.pieza_destino} "
                f"no se puede importar porque '{conn.pieza_destino}' no existe en piezas.csv."
            )
            continue

        # Validar que no se conecte una pieza consigo misma
        if conn.pieza_origen == conn.pieza_destino:
            errors.append(
                f"Fila {i}: una pieza no puede conectarse consigo misma ({conn.pieza_origen})."
            )
            continue

        # Validar conexión duplicada
        conn_key = (conn.pieza_origen, conn.pieza_destino, conn.conexion_pieza1, conn.conexion_pieza2)
        if conn_key in seen_connections:
            errors.append(
                f"Fila {i}: conexión duplicada entre {conn.pieza_origen} y {conn.pieza_destino} "
                f"con puntos ({conn.conexion_pieza1}, {conn.conexion_pieza2})."
            )
            continue
        seen_connections.add(conn_key)

        valid_connections.append(conn)

    return valid_connections, errors
