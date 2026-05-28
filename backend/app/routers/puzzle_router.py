from fastapi import APIRouter
from app.errors import AppError, PUZZLE_NOT_FOUND
from app.repositories.puzzle_repository import puzzle_repository

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
