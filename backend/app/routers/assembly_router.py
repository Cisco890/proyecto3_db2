from fastapi import APIRouter
from app.schemas.assembly_schema import AssemblyRequest, AssemblyResult
from app.services.assembly_service import generate_assembly_steps

router = APIRouter(prefix="/api/puzzles", tags=["assembly"])


@router.post("/{puzzle_id}/assembly", response_model=AssemblyResult)
def run_assembly(puzzle_id: str, body: AssemblyRequest):
    """
    Ejecuta el algoritmo BFS desde la pieza inicial indicada
    y devuelve instrucciones paso a paso para armar el rompecabezas.
    """
    return generate_assembly_steps(puzzle_id, body.start_piece_id)