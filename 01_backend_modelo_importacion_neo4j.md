# 01 Backend: modelo, conexión a Neo4j e importación de datos

## Objetivo

Implementar la base del backend para conectar con Neo4j, crear las restricciones necesarias, leer archivos de entrada e importar el rompecabezas al modelo de grafo.

Este paso construye la base que usarán el algoritmo, la API y el frontend. Antes de continuar con cualquier otra parte, debe quedar funcionando la importación completa de `Puzzle`, `Pieza`, `CONTIENE` y `CONECTA_CON`.

---

## Verificación antes de comenzar

Antes de iniciar, verificar que se tenga claro el modelo final:

```txt
Puzzle:
- id
- nombre
- tematica
- total_piezas
- imagen_url

Pieza:
- id
- numero
- disponible
- id_puzzle

Relación CONTIENE:
(Puzzle)-[:CONTIENE]->(Pieza)

Relación CONECTA_CON:
(Pieza)-[:CONECTA_CON {conexion_pieza1, conexion_pieza2}]->(Pieza)
```

No se debe agregar `imagen_url` en `Pieza`.  
No se debe agregar una base de datos PostgreSQL para la imagen.  
No se debe cambiar la estructura de `CONECTA_CON`.

---

## Tecnologías de este paso

Usar:

```txt
Python
FastAPI
Neo4j
neo4j driver
pydantic
python-dotenv
uvicorn
```

Aunque FastAPI se terminará de exponer en el siguiente paso, desde este primer paso se debe dejar la estructura lista para que la API pueda crecer sin romperse.

---

## Estructura inicial del backend

Crear esta estructura:

```txt
backend/
│
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── config.py
│   ├── db.py
│   │
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── puzzle_schema.py
│   │
│   ├── repositories/
│   │   ├── __init__.py
│   │   └── puzzle_repository.py
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── import_service.py
│   │   └── validation_service.py
│   │
│   └── routers/
│       └── __init__.py
│
├── data/
│   ├── puzzle.json
│   ├── piezas.csv
│   └── conexiones.csv
│
├── uploads/
│   └── puzzles/
│
├── tests/
│
├── .env
├── requirements.txt
└── README.md
```

---

## Dependencias

En `requirements.txt` agregar:

```txt
fastapi
uvicorn
neo4j
pydantic
python-dotenv
python-multipart
pytest
```

Instalar dependencias:

```bash
pip install -r requirements.txt
```

---

## Variables de entorno

Crear un archivo `.env`:

```env
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=tu_password
UPLOAD_DIR=uploads/puzzles
```

No escribir credenciales directamente dentro del código.

---

## Configuración

En `app/config.py`, centralizar la lectura de variables de entorno.

Debe existir una configuración para:

```txt
NEO4J_URI
NEO4J_USER
NEO4J_PASSWORD
UPLOAD_DIR
```

El resto del backend debe leer estos valores desde `config.py`, no desde variables sueltas en diferentes archivos.

---

## Conexión a Neo4j

En `app/db.py`, implementar la conexión usando el driver oficial de Neo4j.

Debe existir una clase o módulo que permita:

```txt
- Crear el driver.
- Obtener sesiones.
- Cerrar la conexión correctamente.
- Ejecutar verificaciones básicas de conectividad.
```

Ejemplo de comportamiento esperado:

```txt
Al iniciar el backend:
- Se carga la configuración.
- Se crea el driver de Neo4j.
- Se puede ejecutar una consulta simple como RETURN 1.
```

---

## Restricciones en Neo4j

Crear una función para inicializar restricciones. Esta función debe ejecutarse al iniciar el backend o antes de importar datos.

Consultas necesarias:

```cypher
CREATE CONSTRAINT puzzle_id_unique IF NOT EXISTS
FOR (p:Puzzle)
REQUIRE p.id IS UNIQUE;
```

```cypher
CREATE CONSTRAINT pieza_id_unique IF NOT EXISTS
FOR (p:Pieza)
REQUIRE p.id IS UNIQUE;
```

Estas restricciones ayudan a evitar duplicados y permiten que `MERGE` trabaje correctamente.

---

## Archivos de entrada

El importador debe trabajar con estos archivos:

```txt
puzzle.json
piezas.csv
conexiones.csv
imagen general del rompecabezas
```

La imagen puede venir ya referenciada en `puzzle.json` o puede copiarse a `uploads/puzzles/` antes de importar. En cualquier caso, Neo4j solo debe guardar la ruta final en `imagen_url`.

---

## Formato de `puzzle.json`

```json
{
  "id": "puzzle_001",
  "nombre": "Rompecabezas de prueba",
  "tematica": "Paisaje",
  "total_piezas": 6,
  "imagen_url": "/uploads/puzzles/puzzle_001.jpg"
}
```

Validar:

```txt
- id no vacío
- nombre no vacío
- tematica no vacía
- total_piezas entero mayor a 0
- imagen_url no vacía
```

---

## Formato de `piezas.csv`

```csv
id,numero,disponible,id_puzzle
pieza_001,1,true,puzzle_001
pieza_002,2,true,puzzle_001
pieza_003,3,true,puzzle_001
pieza_004,4,false,puzzle_001
pieza_005,5,true,puzzle_001
pieza_006,6,true,puzzle_001
```

Validar:

```txt
- Cada pieza debe tener id.
- Cada pieza debe tener numero.
- numero debe ser entero.
- disponible debe convertirse a booleano.
- id_puzzle debe coincidir con el puzzle importado.
- No debe haber ids duplicados en el archivo.
- No debe haber números físicos duplicados dentro del mismo puzzle.
```

---

## Formato de `conexiones.csv`

```csv
pieza_origen,pieza_destino,conexion_pieza1,conexion_pieza2
pieza_001,pieza_002,3,1
pieza_002,pieza_003,2,4
pieza_001,pieza_005,1,2
pieza_005,pieza_006,3,1
```

Validar:

```txt
- pieza_origen debe existir en piezas.csv.
- pieza_destino debe existir en piezas.csv.
- conexion_pieza1 debe ser entero.
- conexion_pieza2 debe ser entero.
- No debe conectarse una pieza consigo misma.
- No debe existir una conexión duplicada con las mismas piezas y los mismos puntos de conexión.
```

---

## Servicio de validación

En `app/services/validation_service.py`, crear funciones separadas para validar:

```txt
- puzzle.json
- piezas.csv
- conexiones.csv
- consistencia entre puzzle, piezas y conexiones
- existencia de imagen_url o ruta esperada
```

La validación debe ocurrir antes de escribir en Neo4j.

Si hay errores, el importador debe devolver mensajes claros. Por ejemplo:

```txt
La conexión pieza_002 -> pieza_009 no se puede importar porque pieza_009 no existe en piezas.csv.
```

---

## Repositorio de Neo4j

En `app/repositories/puzzle_repository.py`, crear funciones para interactuar con Neo4j.

Funciones necesarias:

```txt
create_or_update_puzzle(puzzle)
create_or_update_piece(piece)
create_contains_relation(puzzle_id, piece_id)
create_connection(piece_origin, piece_destination, conexion_pieza1, conexion_pieza2)
get_puzzle_by_id(puzzle_id)
get_pieces_by_puzzle(puzzle_id)
get_connections_by_puzzle(puzzle_id)
```

Usar `MERGE` para evitar duplicados.

---

## Consulta para crear o actualizar `Puzzle`

```cypher
MERGE (p:Puzzle {id: $id})
SET p.nombre = $nombre,
    p.tematica = $tematica,
    p.total_piezas = $total_piezas,
    p.imagen_url = $imagen_url
RETURN p;
```

---

## Consulta para crear o actualizar `Pieza`

```cypher
MERGE (pieza:Pieza {id: $id})
SET pieza.numero = $numero,
    pieza.disponible = $disponible,
    pieza.id_puzzle = $id_puzzle
RETURN pieza;
```

---

## Consulta para crear `CONTIENE`

```cypher
MATCH (p:Puzzle {id: $id_puzzle})
MATCH (pieza:Pieza {id: $id_pieza})
MERGE (p)-[:CONTIENE]->(pieza);
```

---

## Consulta para crear `CONECTA_CON`

```cypher
MATCH (a:Pieza {id: $pieza_origen})
MATCH (b:Pieza {id: $pieza_destino})
MERGE (a)-[r:CONECTA_CON {
  conexion_pieza1: $conexion_pieza1,
  conexion_pieza2: $conexion_pieza2
}]->(b)
RETURN r;
```

---

## Servicio de importación

En `app/services/import_service.py`, implementar el flujo completo:

```txt
1. Leer puzzle.json.
2. Leer piezas.csv.
3. Leer conexiones.csv.
4. Validar puzzle.
5. Validar piezas.
6. Validar conexiones.
7. Crear o actualizar Puzzle.
8. Crear o actualizar Pieza por cada fila.
9. Crear relación CONTIENE por cada pieza.
10. Crear relación CONECTA_CON por cada conexión.
11. Devolver resumen de importación.
```

El resumen debe tener una estructura parecida a:

```json
{
  "puzzle_id": "puzzle_001",
  "puzzle_imported": true,
  "pieces_imported": 6,
  "connections_imported": 4,
  "image_url": "/uploads/puzzles/puzzle_001.jpg",
  "warnings": []
}
```

---

## Archivo `main.py`

En este paso, `main.py` puede ser mínimo, pero debe permitir probar que el backend inicia y que la conexión funciona.

Debe incluir:

```txt
- Creación de la aplicación FastAPI.
- Configuración básica.
- Inicialización de restricciones.
- Ruta simple de health check.
```

Ejemplo de endpoint inicial:

```txt
GET /health
```

Respuesta esperada:

```json
{
  "status": "ok",
  "database": "connected"
}
```

---

## Verificación de este paso

Antes de continuar con el siguiente archivo, verificar todo esto:

```txt
- El entorno virtual existe y las dependencias están instaladas.
- Neo4j está corriendo.
- El archivo .env existe.
- El backend puede conectarse a Neo4j.
- Las restricciones se crean correctamente.
- puzzle.json se puede leer.
- piezas.csv se puede leer.
- conexiones.csv se puede leer.
- Las validaciones detectan errores básicos.
- Se crea un nodo Puzzle con imagen_url.
- Se crean nodos Pieza.
- Se crean relaciones CONTIENE.
- Se crean relaciones CONECTA_CON.
- Ejecutar dos veces la importación no duplica datos.
```

Consulta de verificación en Neo4j Browser:

```cypher
MATCH (p:Puzzle)-[:CONTIENE]->(pieza:Pieza)
RETURN p, pieza;
```

```cypher
MATCH (a:Pieza)-[r:CONECTA_CON]->(b:Pieza)
RETURN a, r, b;
```

---

## Criterios de aceptación

Este paso se considera terminado cuando:

```txt
- El backend tiene conexión funcional con Neo4j.
- El modelo de datos se crea correctamente.
- La importación desde archivos funciona.
- El nodo Puzzle incluye imagen_url.
- No se agregaron propiedades innecesarias a Pieza.
- No se cambió el modelo base.
- No se usa PostgreSQL para guardar imágenes.
- No se generan duplicados al importar más de una vez.
- El código está organizado en configuración, repositorios, servicios y esquemas.
- Se toman en cuenta buenas prácticas de programación.
```
