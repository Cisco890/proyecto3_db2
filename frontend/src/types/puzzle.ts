export type Puzzle = {
  id: string;
  nombre: string;
  tematica: string;
  total_piezas: number;
  imagen_url: string;
  piezas_disponibles?: number;
  piezas_faltantes?: number;
  total_conexiones?: number;
};

export type Piece = {
  id: string;
  numero: number;
  disponible: boolean;
  id_puzzle: string;
};

export type Connection = {
  pieza_origen: string;
  numero_origen: number;
  pieza_destino: string;
  numero_destino: number;
  conexion_pieza1: number;
  conexion_pieza2: number;
};

export type ImportResult = {
  puzzle_id: string;
  puzzle_imported: boolean;
  pieces_imported: number;
  connections_imported: number;
  image_url: string;
  warnings: string[];
};
