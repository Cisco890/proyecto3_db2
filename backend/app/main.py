from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os

from app.config import settings
from app.db import db
from app.services.import_service import import_puzzle_from_files, import_puzzle_from_data_dir
from app.routers import puzzle_router, assembly_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Maneja el ciclo de vida del backend: conexión y cierre de Neo4j."""
    db.connect()
    db.init_constraints()
    yield
    db.close()


app = FastAPI(
    title="Rompecabezas API",
    description="API para modelar y armar rompecabezas usando Neo4j",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS para permitir conexiones del frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Servir archivos estáticos de uploads
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Routers del paso 02
app.include_router(puzzle_router.router)
app.include_router(assembly_router.router)


# ------------------------------------------------------------------ #
#  Endpoints del paso 01 (se mantienen igual)                        #
# ------------------------------------------------------------------ #

@app.get("/health")
def health_check():
    """Endpoint de health check para verificar que el backend y Neo4j están funcionando."""
    connected = db.verify()
    return {
        "status": "ok" if connected else "error",
        "database": "connected" if connected else "disconnected",
    }


@app.post("/api/puzzles/import")
async def import_puzzle(
    puzzle_file: UploadFile = File(..., description="Archivo puzzle.json"),
    pieces_file: UploadFile = File(..., description="Archivo piezas.csv"),
    connections_file: UploadFile = File(..., description="Archivo conexiones.csv"),
    image_file: UploadFile = File(None, description="Imagen general del rompecabezas"),
):
    """Importa un rompecabezas completo desde archivos."""
    try:
        result = await import_puzzle_from_files(
            puzzle_file=puzzle_file,
            pieces_file=pieces_file,
            connections_file=connections_file,
            image_file=image_file,
        )
        return result.model_dump()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error durante la importación: {str(e)}")


@app.post("/api/puzzles/import-local")
def import_puzzle_local():
    """Importa el rompecabezas desde los archivos en data/ (para pruebas locales)."""
    try:
        result = import_puzzle_from_data_dir()
        return result.model_dump()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=f"Archivo no encontrado: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error durante la importación: {str(e)}")