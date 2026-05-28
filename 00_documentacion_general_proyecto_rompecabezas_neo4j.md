# Documentación general del proyecto: Rompecabezas con Neo4j

## 1. Descripción general

El proyecto consiste en desarrollar una aplicación capaz de modelar un rompecabezas físico como un grafo en Neo4j y generar instrucciones paso a paso para armarlo desde una pieza inicial. El sistema debe permitir trabajar con rompecabezas completos y también con rompecabezas que tengan piezas faltantes.

La idea principal es representar cada pieza como un nodo y cada unión entre piezas como una relación. De esta forma, el armado del rompecabezas se puede resolver recorriendo el grafo mediante un algoritmo BFS. El resultado del algoritmo no será solamente una lista de piezas, sino una guía de armado entendible para una persona.

El modelo debe mantenerse simple y centrado en el problema. No se debe agregar una base de datos adicional para imágenes ni cambiar la estructura central del modelo. La imagen general del rompecabezas se guardará como archivo y Neo4j solamente almacenará la ruta o URL de esa imagen.

---

## 2. Objetivo del proyecto

El objetivo es construir un sistema que permita:

1. Registrar un rompecabezas físico.
2. Asociarle una imagen general de referencia.
3. Registrar sus piezas.
4. Registrar las conexiones entre piezas usando puntos físicos numerados.
5. Indicar qué piezas están disponibles y cuáles faltan.
6. Importar la información desde archivos externos.
7. Guardar el modelo en Neo4j.
8. Ejecutar un algoritmo de armado desde cualquier pieza inicial.
9. Generar instrucciones claras y amigables para el usuario.
10. Mostrar el avance, piezas colocadas, piezas pendientes y piezas faltantes.

---

## 3. Alcance funcional

El sistema debe permitir las siguientes funcionalidades:

### Gestión de datos

- Cargar un rompecabezas desde archivos.
- Crear o actualizar el nodo `Puzzle`.
- Crear o actualizar nodos `Pieza`.
- Crear relaciones `CONTIENE`.
- Crear relaciones `CONECTA_CON`.
- Evitar duplicados al importar varias veces.
- Validar que las conexiones hagan referencia a piezas existentes.
- Validar que cada pieza pertenezca al rompecabezas correcto.
- Guardar la ruta de la imagen general del rompecabezas en el nodo `Puzzle`.

### Algoritmo de armado

- Recibir una pieza inicial.
- Validar que la pieza inicial exista.
- Validar que la pieza inicial esté disponible.
- Recorrer las piezas conectadas mediante BFS.
- Ignorar piezas con `disponible = false`.
- Generar pasos de armado usando las conexiones físicas numeradas.
- Reportar piezas faltantes.
- Reportar conexiones que no se pudieron realizar.
- Permitir armado parcial si faltan piezas.

### Interfaz de usuario

- Mostrar un diseño limpio, moderno y fácil de usar.
- Permitir importar archivos del rompecabezas.
- Mostrar la imagen general del rompecabezas.
- Mostrar resumen de piezas disponibles y faltantes.
- Permitir seleccionar una pieza inicial.
- Mostrar instrucciones paso a paso.
- Mostrar progreso del armado.
- Mostrar piezas colocadas, pendientes y faltantes.
- Mostrar advertencias sin mezclar el texto de advertencia con la instrucción principal.

---

## 4. Modelo de datos en Neo4j

El modelo base se mantiene igual, agregando únicamente `imagen_url` al nodo `Puzzle`.

### Nodo `Puzzle`

```json
{
  "id": "uuid o entero",
  "nombre": "string",
  "tematica": "string",
  "total_piezas": "entero",
  "imagen_url": "ruta o URL de la imagen general del rompecabezas"
}
```

### Nodo `Pieza`

```json
{
  "id": "uuid o entero",
  "numero": "entero — número físico marcado en la pieza",
  "disponible": "boolean — true si la pieza está presente, false si falta",
  "id_puzzle": "referencia al Puzzle al que pertenece"
}
```

### Relación `CONTIENE`

```cypher
(Puzzle)-[:CONTIENE]->(Pieza)
```

Esta relación indica que una pieza pertenece a un rompecabezas.

### Relación `CONECTA_CON`

```cypher
(Pieza)-[:CONECTA_CON {
  conexion_pieza1: entero,
  conexion_pieza2: entero
}]->(Pieza)
```

Esta relación indica que dos piezas se conectan físicamente. Los atributos `conexion_pieza1` y `conexion_pieza2` representan los puntos físicos numerados en cada pieza.

---

## 5. Justificación del modelo

Neo4j es adecuado porque el problema es naturalmente un grafo:

- Las piezas son entidades conectadas.
- Las uniones entre piezas son relaciones.
- El armado es un recorrido del grafo.
- Las piezas faltantes pueden manejarse con una propiedad booleana.
- El algoritmo puede recorrer conexiones sin usar consultas recursivas complejas como en SQL.

No se usará PostgreSQL para la imagen. La imagen se guardará como archivo y en Neo4j solo se guardará su ruta. Esto evita complejidad innecesaria y mantiene el proyecto enfocado en el modelo de grafo.

---

## 6. Archivos de entrada

Se recomienda manejar tres archivos de datos y una imagen general.

```txt
data/
├── puzzle.json
├── piezas.csv
└── conexiones.csv

uploads/
└── puzzles/
    └── puzzle_001.jpg
```

### `puzzle.json`

```json
{
  "id": "puzzle_001",
  "nombre": "Rompecabezas de prueba",
  "tematica": "Paisaje",
  "total_piezas": 6,
  "imagen_url": "/uploads/puzzles/puzzle_001.jpg"
}
```

### `piezas.csv`

```csv
id,numero,disponible,id_puzzle
pieza_001,1,true,puzzle_001
pieza_002,2,true,puzzle_001
pieza_003,3,true,puzzle_001
pieza_004,4,false,puzzle_001
pieza_005,5,true,puzzle_001
pieza_006,6,true,puzzle_001
```

### `conexiones.csv`

```csv
pieza_origen,pieza_destino,conexion_pieza1,conexion_pieza2
pieza_001,pieza_002,3,1
pieza_002,pieza_003,2,4
pieza_001,pieza_005,1,2
pieza_005,pieza_006,3,1
```

---

## 7. Stack tecnológico

### Base de datos

- Neo4j Community Edition o Neo4j AuraDB gratuito.
- Neo4j Browser para inspección visual del grafo.

### Backend

- Python.
- FastAPI para construir la API.
- `neo4j` como driver oficial.
- `pydantic` para validaciones de entrada y salida.
- `python-dotenv` para variables de entorno.
- `uvicorn` para ejecutar el servidor.
- `pytest` para pruebas.

### Frontend

- React con Vite.
- TypeScript recomendado para evitar errores de integración.
- Tailwind CSS para estilos.
- React Router para navegación.
- Fetch o Axios para consumir el backend.
- Componentes reutilizables para tarjetas, formularios, tablas, mensajes de error y pasos de armado.

---

## 8. Arquitectura general

```txt
proyecto-rompecabezas/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── db.py
│   │   ├── schemas/
│   │   ├── repositories/
│   │   ├── services/
│   │   └── routers/
│   ├── data/
│   ├── uploads/
│   │   └── puzzles/
│   ├── tests/
│   ├── requirements.txt
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── types/
│   │   └── App.tsx
│   ├── public/
│   ├── package.json
│   └── README.md
│
└── README.md
```

---

## 9. Flujo de uso esperado

1. El usuario abre la aplicación web.
2. El usuario entra a la sección de importación.
3. El usuario carga `puzzle.json`, `piezas.csv`, `conexiones.csv` y la imagen general.
4. El frontend envía los archivos al backend.
5. El backend valida los archivos.
6. El backend guarda la imagen en `/uploads/puzzles`.
7. El backend actualiza `imagen_url` en el nodo `Puzzle`.
8. El backend importa nodos y relaciones en Neo4j.
9. El usuario abre el detalle del rompecabezas.
10. El usuario revisa la imagen general, piezas disponibles y piezas faltantes.
11. El usuario selecciona una pieza inicial.
12. El backend ejecuta BFS.
13. El frontend muestra instrucciones paso a paso.
14. El usuario sigue las instrucciones.
15. El sistema muestra progreso y resumen final.

---

## 10. Formato esperado de instrucciones de armado

Cada paso debe tener un formato fijo para que el usuario no se pierda.

```txt
Paso N

Pieza base:
Pieza X

Nueva pieza:
Pieza Y

Conexión:
Une la conexión A de la pieza X con la conexión B de la pieza Y.

Antes de continuar:
Verifica que la pieza X ya esté colocada en el grupo armado.

Resultado esperado:
Al finalizar este paso, las piezas colocadas deben ser:
X, Y, ...

Progreso:
M de T piezas disponibles colocadas.

Diagrama actual:
[X]---[Y]
```

Si una pieza falta:

```txt
Advertencia:
La pieza 4 no está disponible, por lo tanto se omitirá esta conexión.

Continúa con la siguiente pieza disponible.
```

Al final:

```txt
Armado parcial completado.

Piezas colocadas:
1, 2, 3, 5, 6

Piezas faltantes:
4

Conexiones no realizadas:
Pieza 3 conexión 2 con pieza 4 conexión 1
Pieza 4 conexión 3 con pieza 6 conexión 2
```

---

## 11. API esperada

La API debe mantener un contrato estable para que el frontend no se rompa.

### Endpoints principales

```txt
POST /api/puzzles/import
GET  /api/puzzles
GET  /api/puzzles/{puzzle_id}
GET  /api/puzzles/{puzzle_id}/pieces
GET  /api/puzzles/{puzzle_id}/connections
POST /api/puzzles/{puzzle_id}/assembly
GET  /uploads/puzzles/{filename}
```

### Respuesta esperada del algoritmo

```json
{
  "puzzle_id": "puzzle_001",
  "start_piece_id": "pieza_001",
  "status": "partial",
  "steps": [
    {
      "step_number": 1,
      "base_piece": 1,
      "new_piece": 2,
      "base_connection": 3,
      "new_connection": 1,
      "instruction": "Une la conexión 3 de la pieza 1 con la conexión 1 de la pieza 2.",
      "placed_pieces": [1, 2],
      "pending_pieces": [3, 5, 6],
      "missing_pieces": [4],
      "progress": "2 de 5 piezas disponibles colocadas",
      "diagram": "[1]---[2]"
    }
  ],
  "placed_pieces": [1, 2, 3, 5, 6],
  "missing_pieces": [4],
  "unresolved_connections": [
    {
      "from_piece": 3,
      "from_connection": 2,
      "to_piece": 4,
      "to_connection": 1
    }
  ]
}
```

---

## 12. Buenas prácticas obligatorias

Durante toda la implementación se deben tomar en cuenta buenas prácticas de programación:

- Separar responsabilidades entre rutas, servicios, repositorios y componentes.
- No escribir credenciales directamente en el código.
- Usar variables de entorno.
- Validar entradas antes de insertar datos.
- Usar `MERGE` en Neo4j para evitar duplicados.
- Mantener nombres consistentes entre backend y frontend.
- Documentar cómo ejecutar cada parte.
- Manejar errores de forma clara.
- Mantener una interfaz visual limpia y amigable.
- No agregar comentarios como nombres de integrantes, número de persona o división interna del trabajo.
- No cambiar el modelo base sin una razón clara.
- Mantener compatibilidad entre los endpoints del backend y las llamadas del frontend.
- Probar cada avance antes de continuar con el siguiente.

---

## 13. Orden recomendado de implementación

El proyecto debe implementarse en este orden:

1. `01_backend_modelo_importacion_neo4j.md`
2. `02_backend_api_algoritmo_bfs.md`
3. `03_backend_validaciones_pruebas_finales.md`
4. `04_frontend_base_diseno_navegacion.md`
5. `05_frontend_importacion_visualizacion.md`
6. `06_frontend_armado_integracion_final.md`

Cada archivo depende del anterior. No se debe iniciar un paso sin verificar que el anterior funciona.
