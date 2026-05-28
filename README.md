# Rompecabezas con Neo4j

Aplicacion para modelar un rompecabezas fisico como grafo en Neo4j y generar instrucciones de armado paso a paso desde una pieza inicial. Cada pieza se guarda como nodo, cada union como relacion y el armado se calcula con BFS.

## Tecnologias

- Neo4j Community Edition o AuraDB
- Python, FastAPI, Pydantic y driver oficial `neo4j`
- React, TypeScript, Vite y Tailwind CSS
- Pytest para pruebas del backend

## Levantar Neo4j

1. Iniciar Neo4j local o crear una instancia AuraDB.
2. Confirmar que Bolt este disponible, por ejemplo `bolt://localhost:7687`.
3. Crear o confirmar las credenciales del usuario `neo4j`.

## Levantar Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Crear `backend/.env`:

```env
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=tu_password
UPLOAD_DIR=uploads/puzzles
```

Ejecutar:

```bash
uvicorn app.main:app --reload --port 8000
```

## Levantar Frontend

```bash
cd frontend
npm install
npm run dev
```

Si el backend usa otra URL, crear `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
```

## Importar Datos

Desde el frontend entrar a `/importar` y cargar:

```txt
puzzle.json
piezas.csv
conexiones.csv
imagen general del rompecabezas
```

El backend valida los archivos, guarda la imagen en `backend/uploads/puzzles` y crea o actualiza el grafo en Neo4j.

## Ejecutar Armado

1. Abrir el dashboard en `/`.
2. Seleccionar un rompecabezas.
3. Verificar la imagen, piezas y conexiones.
4. Presionar `Comenzar armado`.
5. Seleccionar una pieza inicial disponible.
6. Presionar `Generar instrucciones`.
7. Avanzar por la guia paso a paso.

La guia muestra pieza base, nueva pieza, puntos de conexion, progreso, piezas colocadas, pendientes, faltantes y conexiones no realizadas.

## Estructura

```txt
backend/
  app/
    main.py
    config.py
    db.py
    routers/
    schemas/
    repositories/
    services/
  data/
  tests/
  uploads/puzzles/
  requirements.txt

frontend/
  src/
    api/
    components/
    pages/
    types/
    utils/
  public/
  package.json
```

## Endpoints Principales

```txt
POST /api/puzzles/import
GET  /api/puzzles
GET  /api/puzzles/{puzzle_id}
GET  /api/puzzles/{puzzle_id}/pieces
GET  /api/puzzles/{puzzle_id}/connections
POST /api/puzzles/{puzzle_id}/assembly
GET  /uploads/puzzles/{filename}
```

## Verificacion

```bash
cd frontend
npm run build
```

```bash
cd backend
pytest
```

Para inspeccionar el grafo en Neo4j Browser:

```cypher
MATCH (p:Puzzle)-[:CONTIENE]->(pieza:Pieza) RETURN p, pieza;
MATCH (a:Pieza)-[r:CONECTA_CON]->(b:Pieza) RETURN a, r, b;
```
