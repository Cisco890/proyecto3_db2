from fastapi import APIRouter
from app.errors import (
    AppError,
    PUZZLE_NOT_FOUND,
    PIECE_NOT_FOUND,
    PIECE_NOT_IN_PUZZLE,
    DATABASE_ERROR,
)
from app.repositories.puzzle_repository import puzzle_repository
from app.schemas.puzzle_schema import PieceAvailabilityUpdateSchema

router = APIRouter(prefix="/api/puzzles", tags=["puzzles"])


@router.get("")
def list_puzzles():
    return puzzle_repository.get_all_puzzles()


@router.get("/{puzzle_id}")
def get_puzzle(puzzle_id: str):
    puzzle = puzzle_repository.get_puzzle_by_id(puzzle_id)
    if not puzzle:
        raise AppError(404, "Puzzle no encontrado.", PUZZLE_NOT_FOUND)
    return puzzle


@router.get("/{puzzle_id}/pieces")
def get_pieces(puzzle_id: str):
    puzzle = puzzle_repository.get_puzzle_by_id(puzzle_id)
    if not puzzle:
        raise AppError(404, "Puzzle no encontrado.", PUZZLE_NOT_FOUND)
    return puzzle_repository.get_pieces_by_puzzle(puzzle_id)


@router.get("/{puzzle_id}/connections")
def get_connections(puzzle_id: str):
    puzzle = puzzle_repository.get_puzzle_by_id(puzzle_id)
    if not puzzle:
        raise AppError(404, "Puzzle no encontrado.", PUZZLE_NOT_FOUND)
    return puzzle_repository.get_connections_by_puzzle(puzzle_id)


@router.patch("/{puzzle_id}/pieces/{piece_id}/availability")
def update_piece_availability(
    puzzle_id: str, piece_id: str, body: PieceAvailabilityUpdateSchema
):
    puzzle = puzzle_repository.get_puzzle_by_id(puzzle_id)
    if not puzzle:
        raise AppError(404, "Puzzle no encontrado.", PUZZLE_NOT_FOUND)

    piece = puzzle_repository.get_piece_by_id(piece_id)
    if not piece:
        raise AppError(404, "Pieza no encontrada.", PIECE_NOT_FOUND)

    piece_in_puzzle = puzzle_repository.get_piece_in_puzzle(puzzle_id, piece_id)
    if not piece_in_puzzle:
        raise AppError(400, "La pieza no pertenece a este puzzle.", PIECE_NOT_IN_PUZZLE)

    result = puzzle_repository.update_piece_availability(
        puzzle_id, piece_id, body.disponible
    )
    if not result:
        raise AppError(500, "No se pudo actualizar la disponibilidad.", DATABASE_ERROR)

    status = "disponible" if result["disponible"] else "faltante"
    return {
        "detail": f"Estado de pieza actualizado a {status}.",
        **result,
    }


@router.delete("/{puzzle_id}")
def delete_puzzle(puzzle_id: str):
    result = puzzle_repository.delete_puzzle(puzzle_id)
    if not result:
        raise AppError(404, "Puzzle no encontrado.", PUZZLE_NOT_FOUND)
    return {
        "detail": "Puzzle eliminado correctamente.",
        **result,
    }


@router.delete("/{puzzle_id}/pieces/{piece_id}")
def delete_piece(puzzle_id: str, piece_id: str):
    puzzle = puzzle_repository.get_puzzle_by_id(puzzle_id)
    if not puzzle:
        raise AppError(404, "Puzzle no encontrado.", PUZZLE_NOT_FOUND)

    piece = puzzle_repository.get_piece_by_id(piece_id)
    if not piece:
        raise AppError(404, "Pieza no encontrada.", PIECE_NOT_FOUND)

    piece_in_puzzle = puzzle_repository.get_piece_in_puzzle(puzzle_id, piece_id)
    if not piece_in_puzzle:
        raise AppError(400, "La pieza no pertenece a este puzzle.", PIECE_NOT_IN_PUZZLE)

    result = puzzle_repository.delete_piece(puzzle_id, piece_id)
    if not result:
        raise AppError(500, "No se pudo eliminar la pieza.", DATABASE_ERROR)

    return {
        "detail": "Pieza eliminada correctamente.",
        **result,
    }
