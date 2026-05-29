import { apiDelete, apiGet, apiPatch, apiPost, apiPostForm } from "./client";
import type { Puzzle, Piece, Connection, ImportResult } from "../types/puzzle";
import type { AssemblyResult } from "../types/assembly";

type DeletePieceResult = {
  detail: string;
  puzzle_id: string;
  piece_id: string;
  connections_deleted: number;
  remaining_pieces: number;
};

type DeletePuzzleResult = {
  detail: string;
  puzzle_id: string;
  pieces_deleted: number;
  connections_deleted: number;
};

type UpdatePieceAvailabilityResult = {
  detail: string;
  puzzle_id: string;
  piece_id: string;
  piece_numero: number;
  disponible: boolean;
  active_connections: number;
};

export function getPuzzles(): Promise<Puzzle[]> {
  return apiGet<Puzzle[]>("/api/puzzles");
}

export function getPuzzleById(puzzleId: string): Promise<Puzzle> {
  return apiGet<Puzzle>(`/api/puzzles/${puzzleId}`);
}

export function getPiecesByPuzzle(puzzleId: string): Promise<Piece[]> {
  return apiGet<Piece[]>(`/api/puzzles/${puzzleId}/pieces`);
}

export function getConnectionsByPuzzle(puzzleId: string): Promise<Connection[]> {
  return apiGet<Connection[]>(`/api/puzzles/${puzzleId}/connections`);
}

export function importPuzzle(formData: FormData): Promise<ImportResult> {
  return apiPostForm<ImportResult>("/api/puzzles/import", formData);
}

export function generateAssembly(
  puzzleId: string,
  startPieceId: string
): Promise<AssemblyResult> {
  return apiPost<AssemblyResult>(`/api/puzzles/${puzzleId}/assembly`, {
    start_piece_id: startPieceId,
  });
}

export function deletePieceFromPuzzle(
  puzzleId: string,
  pieceId: string
): Promise<DeletePieceResult> {
  return apiDelete<DeletePieceResult>(`/api/puzzles/${puzzleId}/pieces/${pieceId}`);
}

export function deletePuzzle(puzzleId: string): Promise<DeletePuzzleResult> {
  return apiDelete<DeletePuzzleResult>(`/api/puzzles/${puzzleId}`);
}

export function updatePieceAvailability(
  puzzleId: string,
  pieceId: string,
  disponible: boolean
): Promise<UpdatePieceAvailabilityResult> {
  return apiPatch<UpdatePieceAvailabilityResult>(
    `/api/puzzles/${puzzleId}/pieces/${pieceId}/availability`,
    { disponible }
  );
}
