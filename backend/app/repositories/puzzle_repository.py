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

    def delete_puzzle(self, puzzle_id: str) -> Optional[dict]:
        """Elimina un puzzle junto con sus piezas y conexiones asociadas."""
        with db.get_session() as session:
            counts = session.run(
                """
                MATCH (puz:Puzzle {id: $puzzle_id})
                OPTIONAL MATCH (piece:Pieza {id_puzzle: $puzzle_id})
                OPTIONAL MATCH (piece)-[rel:CONECTA_CON]-()
                RETURN count(DISTINCT piece) AS pieces_deleted,
                       count(DISTINCT rel) AS connections_deleted
                """,
                puzzle_id=puzzle_id,
            ).single()

            if not counts:
                return None

            session.run(
                """
                MATCH (piece:Pieza {id_puzzle: $puzzle_id})
                DETACH DELETE piece
                """,
                puzzle_id=puzzle_id,
            )
            session.run(
                """
                MATCH (puz:Puzzle {id: $puzzle_id})
                DETACH DELETE puz
                """,
                puzzle_id=puzzle_id,
            )

            return {
                "puzzle_id": puzzle_id,
                "pieces_deleted": counts["pieces_deleted"],
                "connections_deleted": counts["connections_deleted"],
            }

    def delete_piece(self, puzzle_id: str, piece_id: str) -> Optional[dict]:
        """Elimina una pieza de un puzzle y devuelve conteos de borrado."""
        with db.get_session() as session:
            result = session.run(
                """
                MATCH (puz:Puzzle {id: $puzzle_id})-[:CONTIENE]->(piece:Pieza {id: $piece_id})
                OPTIONAL MATCH (piece)-[rel:CONECTA_CON]-()
                WITH puz, piece, count(DISTINCT rel) AS connections_deleted
                DETACH DELETE piece
                WITH puz, connections_deleted
                OPTIONAL MATCH (puz)-[:CONTIENE]->(remaining:Pieza)
                WITH puz, connections_deleted, count(remaining) AS remaining_pieces
                SET puz.total_piezas = remaining_pieces
                RETURN connections_deleted, remaining_pieces
                """,
                puzzle_id=puzzle_id,
                piece_id=piece_id,
            ).single()

            if not result:
                return None

            return {
                "puzzle_id": puzzle_id,
                "piece_id": piece_id,
                "connections_deleted": result["connections_deleted"],
                "remaining_pieces": result["remaining_pieces"],
            }

    def update_piece_availability(
        self, puzzle_id: str, piece_id: str, disponible: bool
    ) -> Optional[dict]:
        """Actualiza disponibilidad de una pieza sin borrar relaciones."""
        with db.get_session() as session:
            result = session.run(
                """
                MATCH (puz:Puzzle {id: $puzzle_id})-[:CONTIENE]->(piece:Pieza {id: $piece_id})
                SET piece.disponible = $disponible
                WITH piece
                OPTIONAL MATCH (piece)-[r:CONECTA_CON]-(active_neighbor:Pieza {disponible: true, id_puzzle: $puzzle_id})
                WHERE piece.disponible = true
                RETURN piece.id AS piece_id,
                       piece.numero AS piece_numero,
                       piece.disponible AS disponible,
                       count(DISTINCT r) AS active_connections
                """,
                puzzle_id=puzzle_id,
                piece_id=piece_id,
                disponible=disponible,
            ).single()

            if not result:
                return None

            return {
                "puzzle_id": puzzle_id,
                "piece_id": result["piece_id"],
                "piece_numero": result["piece_numero"],
                "disponible": result["disponible"],
                "active_connections": result["active_connections"],
            }

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
                OPTIONAL MATCH (puz)-[:CONTIENE]->(a:Pieza {disponible: true})-[c:CONECTA_CON]->(b:Pieza {disponible: true})
                WHERE b.id_puzzle = $puzzle_id
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
        """Devuelve conexiones activas (solo entre piezas disponibles)."""
        with db.get_session() as session:
            result = session.run(
                """
                MATCH (puz:Puzzle {id: $puzzle_id})-[:CONTIENE]->(a:Pieza {disponible: true})
                MATCH (a)-[r:CONECTA_CON]->(b:Pieza {disponible: true})
                WHERE b.id_puzzle = $puzzle_id
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

    def get_piece_by_id(self, piece_id: str) -> Optional[dict]:
        """Devuelve una pieza por id."""
        with db.get_session() as session:
            result = session.run(
                """
                MATCH (p:Pieza {id: $piece_id})
                RETURN p
                """,
                piece_id=piece_id,
            )
            record = result.single()
            if not record:
                return None
            return dict(record["p"])

    def get_piece_in_puzzle(self, puzzle_id: str, piece_id: str) -> Optional[dict]:
        """Devuelve la pieza si pertenece al puzzle indicado."""
        with db.get_session() as session:
            result = session.run(
                """
                MATCH (puz:Puzzle {id: $puzzle_id})-[:CONTIENE]->(p:Pieza {id: $piece_id})
                RETURN p
                """,
                puzzle_id=puzzle_id,
                piece_id=piece_id,
            )
            record = result.single()
            if not record:
                return None
            return dict(record["p"])


puzzle_repository = PuzzleRepository()
