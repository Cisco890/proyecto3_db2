from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os

from app.config import settings
from app.db import db
from app.errors import AppError, app_error_handler, IMPORT_VALIDATION_ERROR, DATABASE_ERROR
from app.services.import_service import import_puzzle_from_files, import_puzzle_from_data_dir
from app.routers import puzzle_router, assembly_router


@asynccontextmanager
async def lifespan(app: FastAPI):
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

app.add_exception_handler(AppError, app_error_handler)

# CORS — solo el origen del frontend durante desarrollo.
# Para producción, reemplazar con el dominio real del frontend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(puzzle_router.router)
app.include_router(assembly_router.router)


@app.get("/health")
def health_check():
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
    try:
        result = await import_puzzle_from_files(
            puzzle_file=puzzle_file,
            pieces_file=pieces_file,
            connections_file=connections_file,
            image_file=image_file,
        )
        return result.model_dump()
    except AppError:
        raise
    except Exception:
        raise AppError(500, "Error interno durante la importación.", DATABASE_ERROR)


@app.post("/api/puzzles/import-local")
def import_puzzle_local(data_dir: str = "data"):
    """Importa el rompecabezas desde los archivos en el directorio especificado.
    Usar data_dir=demo para cargar los datos de ejemplo en data/demo/.
    """
    allowed = {"data", "demo"}
    if data_dir not in allowed:
        raise AppError(400, "Directorio no permitido.", IMPORT_VALIDATION_ERROR)
    path = "data" if data_dir == "data" else "data/demo"
    try:
        result = import_puzzle_from_data_dir(path)
        return result.model_dump()
    except AppError:
        raise
    except FileNotFoundError as e:
        raise AppError(404, f"Archivo no encontrado: {e}", IMPORT_VALIDATION_ERROR)
    except Exception:
        raise AppError(500, "Error interno durante la importación.", DATABASE_ERROR)
