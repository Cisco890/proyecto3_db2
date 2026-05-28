from app.db import db


class PuzzleRepository:
    """Repositorio para interactuar con Neo4j — operaciones CRUD sobre Puzzle, Pieza y relaciones."""

    def create_or_update_puzzle(self, puzzle: dict) -> dict:
        """Crea o actualiza un nodo Puzzle."""
        query = """
        MERGE (p:Puzzle {id: $id})
        SET p.nombre = $nombre,
            p.tematica = $tematica,
            p.total_piezas = $total_piezas,
            p.imagen_url = $imagen_url
        RETURN p
        """
        with db.get_session() as session:
            result = session.run(query, **puzzle)
            record = result.single()
            return dict(record["p"]) if record else {}

    def create_or_update_piece(self, piece: dict) -> dict:
        """Crea o actualiza un nodo Pieza."""
        query = """
        MERGE (pieza:Pieza {id: $id})
        SET pieza.numero = $numero,
            pieza.disponible = $disponible,
            pieza.id_puzzle = $id_puzzle
        RETURN pieza
        """
        with db.get_session() as session:
            result = session.run(query, **piece)
            record = result.single()
            return dict(record["pieza"]) if record else {}

    def create_contains_relation(self, puzzle_id: str, piece_id: str):
        """Crea la relación CONTIENE entre un Puzzle y una Pieza."""
        query = """
        MATCH (p:Puzzle {id: $id_puzzle})
        MATCH (pieza:Pieza {id: $id_pieza})
        MERGE (p)-[:CONTIENE]->(pieza)
        """
        with db.get_session() as session:
            session.run(query, id_puzzle=puzzle_id, id_pieza=piece_id)

    def create_connection(self, pieza_origen: str, pieza_destino: str,
                          conexion_pieza1: int, conexion_pieza2: int):
        """Crea la relación CONECTA_CON entre dos piezas."""
        query = """
        MATCH (a:Pieza {id: $pieza_origen})
        MATCH (b:Pieza {id: $pieza_destino})
        MERGE (a)-[r:CONECTA_CON {
            conexion_pieza1: $conexion_pieza1,
            conexion_pieza2: $conexion_pieza2
        }]->(b)
        RETURN r
        """
        with db.get_session() as session:
            session.run(
                query,
                pieza_origen=pieza_origen,
                pieza_destino=pieza_destino,
                conexion_pieza1=conexion_pieza1,
                conexion_pieza2=conexion_pieza2,
            )

    def get_puzzle_by_id(self, puzzle_id: str) -> dict | None:
        """Obtiene un puzzle por su id."""
        query = "MATCH (p:Puzzle {id: $id}) RETURN p"
        with db.get_session() as session:
            result = session.run(query, id=puzzle_id)
            record = result.single()
            return dict(record["p"]) if record else None

    def get_pieces_by_puzzle(self, puzzle_id: str) -> list[dict]:
        """Obtiene todas las piezas de un puzzle."""
        query = """
        MATCH (p:Puzzle {id: $id})-[:CONTIENE]->(pieza:Pieza)
        RETURN pieza
        ORDER BY pieza.numero
        """
        with db.get_session() as session:
            result = session.run(query, id=puzzle_id)
            return [dict(record["pieza"]) for record in result]

    def get_connections_by_puzzle(self, puzzle_id: str) -> list[dict]:
        """Obtiene todas las conexiones entre piezas de un puzzle."""
        query = """
        MATCH (p:Puzzle {id: $id})-[:CONTIENE]->(a:Pieza)
        MATCH (a)-[r:CONECTA_CON]->(b:Pieza)
        WHERE b.id_puzzle = $id
        RETURN a.id AS pieza_origen, b.id AS pieza_destino,
               r.conexion_pieza1 AS conexion_pieza1, r.conexion_pieza2 AS conexion_pieza2
        """
        with db.get_session() as session:
            result = session.run(query, id=puzzle_id)
            return [dict(record) for record in result]


puzzle_repository = PuzzleRepository()
