from fastapi import Request
from fastapi.responses import JSONResponse

PUZZLE_NOT_FOUND = "PUZZLE_NOT_FOUND"
PIECE_NOT_FOUND = "PIECE_NOT_FOUND"
PIECE_NOT_AVAILABLE = "PIECE_NOT_AVAILABLE"
PIECE_NOT_IN_PUZZLE = "PIECE_NOT_IN_PUZZLE"
NO_PIECES_IN_PUZZLE = "NO_PIECES_IN_PUZZLE"
INVALID_FILE_FORMAT = "INVALID_FILE_FORMAT"
INVALID_CONNECTION = "INVALID_CONNECTION"
IMPORT_VALIDATION_ERROR = "IMPORT_VALIDATION_ERROR"
DATABASE_ERROR = "DATABASE_ERROR"


class AppError(Exception):
    def __init__(self, status_code: int, detail: str, code: str):
        self.status_code = status_code
        self.detail = detail
        self.code = code
        super().__init__(detail)


async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "code": exc.code},
    )
