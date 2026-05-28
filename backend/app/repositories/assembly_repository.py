from typing import Optional
from app.db import db


class AssemblyRepository:

    def get_piece_by_id(self, piece_id: str) -> Optional[dict]:
        """Busca una pieza por su id."""
        with db.get_session() as session:
            result = session.run(
                "MATCH (p:Pieza {id: $piece_id}) RETURN p",
                piece_id=piece_id,
            )
            record = result.single()
            return dict(record["p"]) if record else None

    def get_piece_with_puzzle(self, piece_id: str, puzzle_id: str) -> Optional[dict]:
        """Busca una pieza verificando que pertenezca al puzzle indicado."""
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
            return dict(record["p"]) if record else None

    def get_neighbors_with_connections(self, piece_id: str) -> list[dict]:
        """
        Devuelve vecinos de una pieza recorriendo CONECTA_CON en ambas direcciones.
        Determina correctamente cuál punto de conexión corresponde a cada pieza.
        """
        with db.get_session() as session:
            result = session.run(
                """
                MATCH (actual:Pieza {id: $piece_id})-[r:CONECTA_CON]-(vecina:Pieza)
                RETURN actual, r, vecina,
                       startNode(r) AS inicio,
                       endNode(r)   AS fin
                """,
                piece_id=piece_id,
            )
            neighbors = []
            for record in result:
                actual = dict(record["actual"])
                vecina = dict(record["vecina"])
                r = dict(record["r"])
                inicio = dict(record["inicio"])

                # Si la pieza actual es el origen de la relación:
                #   su conexión es conexion_pieza1 y la vecina usa conexion_pieza2
                # Si la pieza actual es el destino (relación invertida):
                #   su conexión es conexion_pieza2 y la vecina usa conexion_pieza1
                if inicio["id"] == actual["id"]:
                    actual_connection = r["conexion_pieza1"]
                    vecina_connection = r["conexion_pieza2"]
                else:
                    actual_connection = r["conexion_pieza2"]
                    vecina_connection = r["conexion_pieza1"]

                neighbors.append(
                    {
                        "vecina": vecina,
                        "actual_connection": actual_connection,
                        "vecina_connection": vecina_connection,
                    }
                )
            return neighbors

    def get_missing_pieces_by_puzzle(self, puzzle_id: str) -> list[dict]:
        """Devuelve las piezas no disponibles de un puzzle."""
        with db.get_session() as session:
            result = session.run(
                """
                MATCH (puz:Puzzle {id: $puzzle_id})-[:CONTIENE]->(p:Pieza {disponible: false})
                RETURN p ORDER BY p.numero
                """,
                puzzle_id=puzzle_id,
            )
            return [dict(record["p"]) for record in result]

    def count_available_pieces(self, puzzle_id: str) -> int:
        """Cuenta las piezas disponibles de un puzzle."""
        with db.get_session() as session:
            result = session.run(
                """
                MATCH (puz:Puzzle {id: $puzzle_id})-[:CONTIENE]->(p:Pieza {disponible: true})
                RETURN count(p) AS total
                """,
                puzzle_id=puzzle_id,
            )
            record = result.single()
            return record["total"] if record else 0


assembly_repository = AssemblyRepository()