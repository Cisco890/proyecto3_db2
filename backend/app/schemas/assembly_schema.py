from pydantic import BaseModel
from typing import Optional, List


class AssemblyRequest(BaseModel):
    start_piece_id: str


class UnresolvedConnection(BaseModel):
    from_piece: int
    from_connection: int
    to_piece: int
    to_connection: int
    reason: str


class AssemblyStep(BaseModel):
    step_number: int
    base_piece_id: str
    base_piece: int
    new_piece_id: str
    new_piece: int
    base_connection: int
    new_connection: int
    instruction: str
    placed_pieces: List[int]
    pending_pieces: List[int]
    missing_pieces: List[int]
    progress: str
    progress_percent: float
    diagram: str
    warning: Optional[str] = None


class AssemblyResult(BaseModel):
    puzzle_id: str
    start_piece_id: str
    status: str  # complete | partial | blocked
    total_available: int
    total_missing: int
    steps: List[AssemblyStep]
    placed_pieces: List[int]
    missing_pieces: List[int]
    unresolved_connections: List[UnresolvedConnection]
    summary: str