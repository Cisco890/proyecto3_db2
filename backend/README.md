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

## Estructura del proyecto

```
backend/
├── app/
│   ├── main.py              # Aplicación FastAPI
│   ├── config.py             # Variables de entorno
│   ├── db.py                 # Conexión a Neo4j
│   ├── schemas/
│   │   └── puzzle_schema.py  # Esquemas Pydantic
│   ├── repositories/
│   │   └── puzzle_repository.py  # Operaciones Neo4j
│   ├── services/
│   │   ├── import_service.py     # Lógica de importación
│   │   └── validation_service.py # Validaciones
│   └── routers/
├── data/                     # Archivos de prueba
├── uploads/puzzles/          # Imágenes de puzzles
├── tests/
├── .env
├── requirements.txt
└── README.md
```

## Verificación en Neo4j Browser

```cypher
-- Ver puzzle y piezas
MATCH (p:Puzzle)-[:CONTIENE]->(pieza:Pieza) RETURN p, pieza;

-- Ver conexiones
MATCH (a:Pieza)-[r:CONECTA_CON]->(b:Pieza) RETURN a, r, b;
```
