import { apiGet, apiPost, apiPostForm } from "./client";
import type { Puzzle, Piece, Connection, ImportResult } from "../types/puzzle";
import type { AssemblyResult } from "../types/assembly";

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
