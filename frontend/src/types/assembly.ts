export type AssemblyStep = {
  step_number: number;
  base_piece_id: string;
  base_piece: number;
  new_piece_id: string;
  new_piece: number;
  base_connection: number;
  new_connection: number;
  instruction: string;
  placed_pieces: number[];
  pending_pieces: number[];
  missing_pieces: number[];
  progress: string;
  progress_percent: number;
  diagram: string;
  warning: string | null;
};

export type UnresolvedConnection = {
  from_piece: number;
  from_connection: number;
  to_piece: number;
  to_connection: number;
  reason: string;
};

export type AssemblyResult = {
  puzzle_id: string;
  start_piece_id: string;
  status: "complete" | "partial" | "blocked";
  total_available: number;
  total_missing: number;
  steps: AssemblyStep[];
  placed_pieces: number[];
  missing_pieces: number[];
  unresolved_connections: UnresolvedConnection[];
  summary: string;
};
