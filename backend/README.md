# Backend - Rompecabezas con Neo4j

## DescripciÃ³n

Backend en Python con FastAPI para modelar rompecabezas como grafos en Neo4j. Permite importar puzzles desde archivos y generar instrucciones de armado.

## Requisitos

- Python 3.10+
- Neo4j Community Edition o AuraDB

## InstalaciÃ³n

```bash
# Crear entorno virtual
python -m venv venv

# Activar entorno virtual (Windows)
venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt
```

## ConfiguraciÃ³n

Editar el archivo `.env` con las credenciales de Neo4j:

```env
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=tu_password
UPLOAD_DIR=uploads/puzzles
```

## EjecuciÃ³n

```bash
uvicorn app.main:app --reload --port 8000
```

## Endpoints disponibles

| MÃ©todo | Ruta | DescripciÃ³n |
|--------|------|-------------|
| GET | `/health` | Health check del backend y Neo4j |
| POST | `/api/puzzles/import` | Importar puzzle desde archivos (multipart) |
| POST | `/api/puzzles/import-local` | Importar desde directorio `data/` |
| GET | `/api/puzzles` | Obtener todos los rompecabezas con su conteo de piezas |
| GET | `/api/puzzles/{puzzle_id}` | Obtener detalle de un rompecabezas especÃ­fico |
| GET | `/api/puzzles/{puzzle_id}/pieces` | Obtener todas las piezas de un rompecabezas especÃ­fico |
| GET | `/api/puzzles/{puzzle_id}/connections` | Obtener conexiones activas entre piezas disponibles |
| PATCH | `/api/puzzles/{puzzle_id}/pieces/{piece_id}/availability` | Actualizar estado disponible/faltante de una pieza |
| DELETE | `/api/puzzles/{puzzle_id}` | Eliminar un rompecabezas con todas sus piezas y conexiones |
| DELETE | `/api/puzzles/{puzzle_id}/pieces/{piece_id}` | Eliminar una pieza especifica del rompecabezas |
| POST | `/api/puzzles/{puzzle_id}/assembly` | Generar orden e instrucciones de armado paso a paso usando BFS |

## Estructura del proyecto

```
backend/
â”œâ”€â”€ app/
â”‚   â”œâ”€â”€ main.py                   # AplicaciÃ³n FastAPI y endpoints principales
â”‚   â”œâ”€â”€ config.py                 # Variables de entorno y configuraciÃ³n
â”‚   â”œâ”€â”€ db.py                     # ConexiÃ³n, inicializaciÃ³n y cierre de Neo4j
â”‚   â”œâ”€â”€ schemas/
â”‚   â”‚   â”œâ”€â”€ puzzle_schema.py      # Esquemas Pydantic para rompecabezas, piezas e importaciÃ³n
â”‚   â”‚   â””â”€â”€ assembly_schema.py    # Esquemas Pydantic para peticiones y resultados de armado
â”‚   â”œâ”€â”€ repositories/
â”‚   â”‚   â”œâ”€â”€ puzzle_repository.py  # Operaciones de base de datos para CRUD de rompecabezas
â”‚   â”‚   â””â”€â”€ assembly_repository.py # Consultas y operaciones Neo4j para el armado (nodos y relaciones)
â”‚   â”œâ”€â”€ services/
â”‚   â”‚   â”œâ”€â”€ import_service.py     # LÃ³gica y flujos de importaciÃ³n desde archivos y directorio local
â”‚   â”‚   â”œâ”€â”€ validation_service.py # Validaciones de congruencia e integridad de las piezas
â”‚   â”‚   â””â”€â”€ assembly_service.py   # Algoritmo BFS para planificar el armado ordenado paso a paso
â”‚   â””â”€â”€ routers/
â”‚       â”œâ”€â”€ puzzle_router.py      # Rutas API para obtener rompecabezas, piezas y conexiones
â”‚       â””â”€â”€ assembly_router.py    # Rutas API para el algoritmo e instrucciones de armado
â”œâ”€â”€ data/                         # Archivos JSON/CSV de prueba para importaciÃ³n local
â”œâ”€â”€ uploads/puzzles/              # Almacenamiento de imÃ¡genes de rompecabezas subidas
â”œâ”€â”€ tests/                        # Pruebas unitarias e integraciÃ³n del sistema
â”œâ”€â”€ .env                          # Variables de entorno y credenciales locales (privado)
â”œâ”€â”€ .env.example                  # Plantilla de variables de entorno de ejemplo
â”œâ”€â”€ requirements.txt              # Dependencias del proyecto
â””â”€â”€ README.md                     # DocumentaciÃ³n general
```

## VerificaciÃ³n en Neo4j Browser

```cypher
-- Ver puzzle y piezas
MATCH (p:Puzzle)-[:CONTIENE]->(pieza:Pieza) RETURN p, pieza;

-- Ver conexiones
MATCH (a:Pieza)-[r:CONECTA_CON]->(b:Pieza) RETURN a, r, b;
```
