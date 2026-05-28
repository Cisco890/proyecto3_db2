# Backend - Rompecabezas con Neo4j

## Descripción

Backend en Python con FastAPI para modelar rompecabezas como grafos en Neo4j. Permite importar puzzles desde archivos y generar instrucciones de armado.

## Requisitos

- Python 3.10+
- Neo4j Community Edition o AuraDB

## Instalación

```bash
# Crear entorno virtual
python -m venv venv

# Activar entorno virtual (Windows)
venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt
```

## Configuración

Editar el archivo `.env` con las credenciales de Neo4j:

```env
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=tu_password
UPLOAD_DIR=uploads/puzzles
```

## Ejecución

```bash
uvicorn app.main:app --reload --port 8000
```

## Endpoints disponibles

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Health check del backend y Neo4j |
| POST | `/api/puzzles/import` | Importar puzzle desde archivos (multipart) |
| POST | `/api/puzzles/import-local` | Importar desde directorio `data/` |
| GET | `/api/puzzles` | Obtener todos los rompecabezas con su conteo de piezas |
| GET | `/api/puzzles/{puzzle_id}` | Obtener detalle de un rompecabezas específico |
| GET | `/api/puzzles/{puzzle_id}/pieces` | Obtener todas las piezas de un rompecabezas específico |
| GET | `/api/puzzles/{puzzle_id}/connections` | Obtener todas las conexiones de un rompecabezas específico |
| POST | `/api/puzzles/{puzzle_id}/assembly` | Generar orden e instrucciones de armado paso a paso usando BFS |

## Estructura del proyecto

```
backend/
├── app/
│   ├── main.py                   # Aplicación FastAPI y endpoints principales
│   ├── config.py                 # Variables de entorno y configuración
│   ├── db.py                     # Conexión, inicialización y cierre de Neo4j
│   ├── schemas/
│   │   ├── puzzle_schema.py      # Esquemas Pydantic para rompecabezas, piezas e importación
│   │   └── assembly_schema.py    # Esquemas Pydantic para peticiones y resultados de armado
│   ├── repositories/
│   │   ├── puzzle_repository.py  # Operaciones de base de datos para CRUD de rompecabezas
│   │   └── assembly_repository.py # Consultas y operaciones Neo4j para el armado (nodos y relaciones)
│   ├── services/
│   │   ├── import_service.py     # Lógica y flujos de importación desde archivos y directorio local
│   │   ├── validation_service.py # Validaciones de congruencia e integridad de las piezas
│   │   └── assembly_service.py   # Algoritmo BFS para planificar el armado ordenado paso a paso
│   └── routers/
│       ├── puzzle_router.py      # Rutas API para obtener rompecabezas, piezas y conexiones
│       └── assembly_router.py    # Rutas API para el algoritmo e instrucciones de armado
├── data/                         # Archivos JSON/CSV de prueba para importación local
├── uploads/puzzles/              # Almacenamiento de imágenes de rompecabezas subidas
├── tests/                        # Pruebas unitarias e integración del sistema
├── .env                          # Variables de entorno y credenciales locales (privado)
├── .env.example                  # Plantilla de variables de entorno de ejemplo
├── requirements.txt              # Dependencias del proyecto
└── README.md                     # Documentación general
```

## Verificación en Neo4j Browser

```cypher
-- Ver puzzle y piezas
MATCH (p:Puzzle)-[:CONTIENE]->(pieza:Pieza) RETURN p, pieza;

-- Ver conexiones
MATCH (a:Pieza)-[r:CONECTA_CON]->(b:Pieza) RETURN a, r, b;
```
