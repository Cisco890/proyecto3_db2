# Frontend - Rompecabezas con Neo4j

Interfaz web en React, TypeScript y Vite para importar rompecabezas, ver sus piezas y seguir una guia de armado generada por el backend con BFS.

## Instalacion

```bash
npm install
```

## Variables de entorno

Crear un archivo `.env` en `frontend/` si el backend no usa el puerto por defecto:

```env
VITE_API_URL=http://localhost:8000
```

Si no se define, el frontend usa `http://localhost:8000`.

## Ejecucion

```bash
npm run dev
```

Vite mostrara la URL local del frontend, normalmente `http://localhost:5173`.

## Build

```bash
npm run build
```

## Dependencia del backend

El frontend consume estos endpoints:

```txt
GET  /api/puzzles
GET  /api/puzzles/{puzzle_id}
GET  /api/puzzles/{puzzle_id}/pieces
GET  /api/puzzles/{puzzle_id}/connections
POST /api/puzzles/import
POST /api/puzzles/{puzzle_id}/assembly
GET  /uploads/puzzles/{filename}
```

El backend debe estar levantado antes de importar datos, ver detalles o generar instrucciones de armado.

## Rutas principales

```txt
/                         Dashboard de rompecabezas
/importar                 Importacion de puzzle, piezas, conexiones e imagen
/puzzles/:puzzleId        Detalle del puzzle con imagen, piezas y conexiones
/puzzles/:puzzleId/armado Guia paso a paso para armar el rompecabezas
```

## Flujo de uso

1. Levantar Neo4j.
2. Levantar el backend en `http://localhost:8000`.
3. Levantar el frontend con `npm run dev`.
4. Importar `puzzle.json`, `piezas.csv`, `conexiones.csv` y la imagen general.
5. Abrir el detalle del rompecabezas.
6. Entrar a `Comenzar armado`.
7. Seleccionar una pieza inicial disponible.
8. Generar instrucciones.
9. Avanzar paso a paso hasta revisar el resumen final.

## Notas de integracion

- El selector de inicio solo usa piezas con `disponible = true`.
- La imagen se muestra desde la ruta guardada en Neo4j.
- Las piezas faltantes y conexiones no realizadas se muestran separadas de la instruccion principal.
- El contrato del armado se centraliza en `src/types/assembly.ts` y `src/api/puzzleApi.ts`.
