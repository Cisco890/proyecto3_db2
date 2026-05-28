from typing import Optional
from app.db import db


class PuzzleRepository:
    # ------------------------------------------------------------------ #
    #  ESCRITURA  (usados por import_service)                             #
    # ------------------------------------------------------------------ #

    def create_or_update_puzzle(self, puzzle: dict) -> None:
        """Crea o actualiza el nodo Puzzle."""
        with db.get_session() as session:
            session.run(
                """
                MERGE (p:Puzzle {id: $id})
                SET p.nombre      = $nombre,
                    p.tematica    = $tematica,
                    p.total_piezas = $total_piezas,
                    p.imagen_url  = $imagen_url
                """,
                id=puzzle.get("id"),
                nombre=puzzle.get("nombre"),
                tematica=puzzle.get("tematica"),
                total_piezas=puzzle.get("total_piezas"),
                imagen_url=puzzle.get("imagen_url"),
            )

    def create_or_update_piece(self, piece: dict) -> None:
        """Crea o actualiza un nodo Pieza."""
        with db.get_session() as session:
            session.run(
                """
                MERGE (p:Pieza {id: $id})
                SET p.numero     = $numero,
                    p.disponible = $disponible,
                    p.id_puzzle  = $id_puzzle
                """,
                id=piece.get("id"),
                numero=piece.get("numero"),
                disponible=piece.get("disponible"),
                id_puzzle=piece.get("id_puzzle"),
            )

    def create_contains_relation(self, puzzle_id: str, piece_id: str) -> None:
        """Crea la relación CONTIENE entre Puzzle y Pieza."""
        with db.get_session() as session:
            session.run(
                """
                MATCH (puz:Puzzle {id: $puzzle_id})
                MATCH (pie:Pieza  {id: $piece_id})
                MERGE (puz)-[:CONTIENE]->(pie)
                """,
                puzzle_id=puzzle_id,
                piece_id=piece_id,
            )

    def create_connection(
        self,
        pieza_origen: str,
        pieza_destino: str,
        conexion_pieza1: int,
        conexion_pieza2: int,
    ) -> None:
        """Crea la relación CONECTA_CON entre dos piezas."""
        with db.get_session() as session:
            session.run(
                """
                MATCH (a:Pieza {id: $origen})
                MATCH (b:Pieza {id: $destino})
                MERGE (a)-[r:CONECTA_CON {conexion_pieza1: $cp1, conexion_pieza2: $cp2}]->(b)
                """,
                origen=pieza_origen,
                destino=pieza_destino,
                cp1=conexion_pieza1,
                cp2=conexion_pieza2,
            )

    # ------------------------------------------------------------------ #
    #  LECTURA  (usados por routers y assembly_service)                   #
    # ------------------------------------------------------------------ #

    def get_all_puzzles(self) -> list[dict]:
        """Devuelve todos los puzzles con conteo de piezas disponibles/faltantes."""
        with db.get_session() as session:
            result = session.run(
                """
                MATCH (puz:Puzzle)
                OPTIONAL MATCH (puz)-[:CONTIENE]->(disponible:Pieza {disponible: true})
                OPTIONAL MATCH (puz)-[:CONTIENE]->(faltante:Pieza  {disponible: false})
                RETURN puz,
                       count(DISTINCT disponible) AS piezas_disponibles,
                       count(DISTINCT faltante)   AS piezas_faltantes
                """
            )
            puzzles = []
            for record in result:
                data = dict(record["puz"])
                data["piezas_disponibles"] = record["piezas_disponibles"]
                data["piezas_faltantes"] = record["piezas_faltantes"]
                puzzles.append(data)
            return puzzles

    def get_puzzle_by_id(self, puzzle_id: str) -> Optional[dict]:
        """Devuelve el detalle de un puzzle con conteo de piezas y conexiones."""
        with db.get_session() as session:
            result = session.run(
                """
                MATCH (puz:Puzzle {id: $puzzle_id})
                OPTIONAL MATCH (puz)-[:CONTIENE]->(disponible:Pieza {disponible: true})
                OPTIONAL MATCH (puz)-[:CONTIENE]->(faltante:Pieza  {disponible: false})
                OPTIONAL MATCH (puz)-[:CONTIENE]->(p:Pieza)-[c:CONECTA_CON]-()
                RETURN puz,
                       count(DISTINCT disponible)  AS piezas_disponibles,
                       count(DISTINCT faltante)    AS piezas_faltantes,
                       count(DISTINCT c)           AS total_conexiones
                """,
                puzzle_id=puzzle_id,
            )
            record = result.single()
            if not record:
                return None
            data = dict(record["puz"])
            data["piezas_disponibles"] = record["piezas_disponibles"]
            data["piezas_faltantes"] = record["piezas_faltantes"]
            data["total_conexiones"] = record["total_conexiones"]
            return data

    def get_pieces_by_puzzle(self, puzzle_id: str) -> list[dict]:
        """Devuelve todas las piezas de un puzzle."""
        with db.get_session() as session:
            result = session.run(
                """
                MATCH (puz:Puzzle {id: $puzzle_id})-[:CONTIENE]->(p:Pieza)
                RETURN p ORDER BY p.numero
                """,
                puzzle_id=puzzle_id,
            )
            return [dict(record["p"]) for record in result]

    def get_connections_by_puzzle(self, puzzle_id: str) -> list[dict]:
        """Devuelve todas las conexiones de un puzzle."""
        with db.get_session() as session:
            result = session.run(
                """
                MATCH (puz:Puzzle {id: $puzzle_id})-[:CONTIENE]->(a:Pieza)
                MATCH (a)-[r:CONECTA_CON]->(b:Pieza)
                RETURN a.id       AS pieza_origen,
                       a.numero   AS numero_origen,
                       b.id       AS pieza_destino,
                       b.numero   AS numero_destino,
                       r.conexion_pieza1 AS conexion_pieza1,
                       r.conexion_pieza2 AS conexion_pieza2
                """,
                puzzle_id=puzzle_id,
            )
            return [dict(record) for record in result]


puzzle_repository = PuzzleRepository()