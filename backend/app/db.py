from neo4j import GraphDatabase
from app.config import settings


class Neo4jConnection:
    """Gestiona la conexión con Neo4j usando el driver oficial."""

    def __init__(self):
        self._driver = None

    def connect(self):
        """Crea el driver de Neo4j."""
        self._driver = GraphDatabase.driver(
            settings.NEO4J_URI,
            auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD),
        )
        self._driver.verify_connectivity()

    def get_session(self):
        """Obtiene una sesión de Neo4j."""
        if self._driver is None:
            raise RuntimeError("El driver de Neo4j no ha sido inicializado. Llama a connect() primero.")
        return self._driver.session()

    def close(self):
        """Cierra la conexión con Neo4j."""
        if self._driver is not None:
            self._driver.close()
            self._driver = None

    def verify(self) -> bool:
        """Ejecuta una consulta simple para verificar la conectividad."""
        try:
            with self.get_session() as session:
                result = session.run("RETURN 1 AS test")
                record = result.single()
                return record is not None and record["test"] == 1
        except Exception:
            return False

    def init_constraints(self):
        """Crea las restricciones de unicidad en Neo4j."""
        constraints = [
            "CREATE CONSTRAINT puzzle_id_unique IF NOT EXISTS FOR (p:Puzzle) REQUIRE p.id IS UNIQUE",
            "CREATE CONSTRAINT pieza_id_unique IF NOT EXISTS FOR (p:Pieza) REQUIRE p.id IS UNIQUE",
        ]
        with self.get_session() as session:
            for constraint in constraints:
                session.run(constraint)


db = Neo4jConnection()
