from fastapi import APIRouter, HTTPException
from app.repositories.puzzle_repository import puzzle_repository

router = APIRouter(prefix="/api/puzzles", tags=["puzzles"])


@router.get("")
def list_puzzles():
    """Devuelve todos los rompecabezas con conteo de piezas."""
    puzzles = puzzle_repository.get_all_puzzles()
    return puzzles


@router.get("/{puzzle_id}")
def get_puzzle(puzzle_id: str):
    """Devuelve el detalle de un rompecabezas."""
    puzzle = puzzle_repository.get_puzzle_by_id(puzzle_id)
    if not puzzle:
        raise HTTPException(status_code=404, detail="Puzzle no encontrado.")
    return puzzle


@router.get("/{puzzle_id}/pieces")
def get_pieces(puzzle_id: str):
    """Devuelve todas las piezas de un rompecabezas."""
    puzzle = puzzle_repository.get_puzzle_by_id(puzzle_id)
    if not puzzle:
        raise HTTPException(status_code=404, detail="Puzzle no encontrado.")
    pieces = puzzle_repository.get_pieces_by_puzzle(puzzle_id)
    return pieces


@router.get("/{puzzle_id}/connections")
def get_connections(puzzle_id: str):
    """Devuelve todas las conexiones de un rompecabezas."""
    puzzle = puzzle_repository.get_puzzle_by_id(puzzle_id)
    if not puzzle:
        raise HTTPException(status_code=404, detail="Puzzle no encontrado.")
    connections = puzzle_repository.get_connections_by_puzzle(puzzle_id)
    return connections