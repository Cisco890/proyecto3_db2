from collections import deque

from app.errors import (
    AppError,
    PUZZLE_NOT_FOUND,
    PIECE_NOT_FOUND,
    PIECE_NOT_AVAILABLE,
    PIECE_NOT_IN_PUZZLE,
    NO_PIECES_IN_PUZZLE,
)
from app.repositories.assembly_repository import assembly_repository
from app.repositories.puzzle_repository import puzzle_repository
from app.schemas.assembly_schema import (
    AssemblyResult,
    AssemblyStep,
    UnresolvedConnection,
)


def _build_instruction(
    base_piece: int,
    new_piece: int,
    base_connection: int,
    new_connection: int,
) -> str:
    return (
        f"Une la conexion {base_connection} de la pieza {base_piece} "
        f"con la conexion {new_connection} de la pieza {new_piece}. "
        "Verifica: ambas piezas quedan firmes y no se separan al soltar."
    )


def _build_diagram(placed: list[int]) -> str:
    if not placed:
        return ""
    return "---".join(f"[{n}]" for n in placed)


def _progress_percent(placed: int, total: int) -> float:
    if total == 0:
        return 0.0
    return round((placed / total) * 100, 1)


def _determine_status(
    placed_count: int,
    total_available: int,
    missing_count: int,
    step_count: int,
) -> str:
    if step_count == 0 and total_available > 1:
        return "blocked"
    if missing_count > 0:
        return "partial"
    if placed_count == total_available:
        return "complete"
    return "partial"


def _build_summary(
    status: str,
    placed_count: int,
    total_available: int,
    missing_count: int,
) -> str:
    if status == "complete":
        return f"Armado completo. Se colocaron {placed_count} de {total_available} piezas."
    if status == "partial":
        return (
            f"Armado parcial completado. "
            f"Se colocaron {placed_count} de {total_available} piezas disponibles. "
            f"Faltan {missing_count} piezas."
        )
    return (
        "No se pudo avanzar desde la pieza inicial. "
        "Verifica las conexiones disponibles."
    )


def generate_assembly_steps(puzzle_id: str, start_piece_id: str) -> AssemblyResult:
    # 1. Validar que el puzzle exista
    puzzle = puzzle_repository.get_puzzle_by_id(puzzle_id)
    if not puzzle:
        raise AppError(404, "Puzzle no encontrado.", PUZZLE_NOT_FOUND)

    # 2. Validar que el puzzle tenga piezas
    all_pieces = puzzle_repository.get_pieces_by_puzzle(puzzle_id)
    if not all_pieces:
        raise AppError(400, "El puzzle no tiene piezas asociadas.", NO_PIECES_IN_PUZZLE)

    all_numbers = [p["numero"] for p in all_pieces]

    # 3. Validar que haya piezas disponibles
    total_available = assembly_repository.count_available_pieces(puzzle_id)
    if total_available == 0:
        raise AppError(
            400,
            "El puzzle no tiene piezas disponibles para armar.",
            PIECE_NOT_AVAILABLE,
        )

    # 4. Validar que la pieza inicial exista y pertenezca al puzzle
    start_piece = assembly_repository.get_piece_with_puzzle(start_piece_id, puzzle_id)
    if not start_piece:
        exists = assembly_repository.get_piece_by_id(start_piece_id)
        if not exists:
            raise AppError(404, "La pieza inicial no fue encontrada.", PIECE_NOT_FOUND)
        raise AppError(
            400,
            "La pieza inicial no pertenece a este puzzle.",
            PIECE_NOT_IN_PUZZLE,
        )

    # 5. Validar que la pieza inicial este disponible
    if not start_piece.get("disponible", False):
        raise AppError(
            400,
            "La pieza inicial no esta disponible. Selecciona una pieza marcada como disponible.",
            PIECE_NOT_AVAILABLE,
        )

    # 6. Piezas faltantes
    missing_data = assembly_repository.get_missing_pieces_by_puzzle(puzzle_id)
    missing_numbers = [p["numero"] for p in missing_data]

    # 7. BFS
    visited: set[str] = set()
    queue: deque[str] = deque()
    steps: list[AssemblyStep] = []
    placed_numbers: list[int] = []
    unresolved: list[UnresolvedConnection] = []
    step_number = 0

    visited.add(start_piece_id)
    queue.append(start_piece_id)
    placed_numbers.append(start_piece["numero"])

    while queue:
        current_id = queue.popleft()
        current = assembly_repository.get_piece_by_id(current_id)
        if not current:
            continue

        neighbors = assembly_repository.get_neighbors_with_connections(puzzle_id, current_id)

        for neighbor in neighbors:
            vecina = neighbor["vecina"]
            vecina_id = vecina["id"]

            if vecina_id in visited:
                continue

            visited.add(vecina_id)
            queue.append(vecina_id)
            placed_numbers.append(vecina["numero"])
            step_number += 1

            pending = [
                n
                for n in all_numbers
                if n not in placed_numbers and n not in missing_numbers
            ]

            step = AssemblyStep(
                step_number=step_number,
                base_piece_id=current_id,
                base_piece=current["numero"],
                new_piece_id=vecina_id,
                new_piece=vecina["numero"],
                base_connection=neighbor["actual_connection"],
                new_connection=neighbor["vecina_connection"],
                instruction=_build_instruction(
                    current["numero"],
                    vecina["numero"],
                    neighbor["actual_connection"],
                    neighbor["vecina_connection"],
                ),
                placed_pieces=list(placed_numbers),
                pending_pieces=pending,
                missing_pieces=list(missing_numbers),
                progress=f"{len(placed_numbers)} de {total_available} piezas disponibles colocadas",
                progress_percent=_progress_percent(len(placed_numbers), total_available),
                diagram=_build_diagram(placed_numbers),
                warning=None,
            )
            steps.append(step)

    # 8. Resultado final
    status = _determine_status(
        len(placed_numbers), total_available, len(missing_numbers), len(steps)
    )
    summary = _build_summary(
        status, len(placed_numbers), total_available, len(missing_numbers)
    )

    return AssemblyResult(
        puzzle_id=puzzle_id,
        start_piece_id=start_piece_id,
        status=status,
        total_available=total_available,
        total_missing=len(missing_numbers),
        steps=steps,
        placed_pieces=list(placed_numbers),
        missing_pieces=list(missing_numbers),
        unresolved_connections=unresolved,
        summary=summary,
    )

