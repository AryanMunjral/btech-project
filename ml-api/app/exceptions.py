"""
Custom Exception Classes & Global Error Handlers
==================================================

Defines application-specific exceptions and FastAPI exception
handlers that return consistent JSON error responses.

Exception Hierarchy:
    MLServiceError (base)
    ├── ModelNotLoadedError   — model artifacts missing
    ├── PredictionError       — prediction pipeline failed
    ├── InvalidInputError     — bad request data
    └── ModelReloadError      — hot-reload failed
"""

from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from app.utils.logger import get_logger

logger = get_logger(__name__)


# ═══════════════════════════════════════════════════════════
# CUSTOM EXCEPTION CLASSES
# ═══════════════════════════════════════════════════════════

class MLServiceError(Exception):
    """Base exception for the ML service."""

    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class ModelNotLoadedError(MLServiceError):
    """Raised when prediction is attempted but no model is loaded."""

    def __init__(self, message: str = "ML model is not loaded. Run 'python train_model.py' first."):
        super().__init__(message, status_code=503)


class PredictionError(MLServiceError):
    """Raised when the prediction pipeline fails."""

    def __init__(self, message: str = "Prediction failed due to an internal error."):
        super().__init__(message, status_code=500)


class InvalidInputError(MLServiceError):
    """Raised for invalid transaction data."""

    def __init__(self, message: str = "Invalid input data."):
        super().__init__(message, status_code=400)


class ModelReloadError(MLServiceError):
    """Raised when model hot-reload fails."""

    def __init__(self, message: str = "Failed to reload the ML model."):
        super().__init__(message, status_code=500)


# ═══════════════════════════════════════════════════════════
# GLOBAL EXCEPTION HANDLERS (registered in main.py)
# ═══════════════════════════════════════════════════════════

async def ml_service_error_handler(request: Request, exc: MLServiceError):
    """Handle all custom ML service exceptions."""
    logger.error(f"MLServiceError: {exc.message} (status={exc.status_code})")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": type(exc).__name__,
            "message": exc.message,
            "status_code": exc.status_code,
        },
    )


async def validation_error_handler(request: Request, exc: RequestValidationError):
    """Handle Pydantic validation errors with clean messages."""
    errors = []
    for error in exc.errors():
        field = " → ".join(str(loc) for loc in error["loc"] if loc != "body")
        errors.append({
            "field": field,
            "message": error["msg"],
            "type": error["type"],
        })

    logger.warning(f"Validation error: {errors}")
    return JSONResponse(
        status_code=422,
        content={
            "error": "ValidationError",
            "message": "Invalid request data. Check the 'details' field.",
            "details": errors,
        },
    )


async def generic_error_handler(request: Request, exc: Exception):
    """Catch-all handler for unexpected errors."""
    logger.exception(f"Unhandled error: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "InternalServerError",
            "message": "An unexpected error occurred. Check server logs.",
        },
    )
