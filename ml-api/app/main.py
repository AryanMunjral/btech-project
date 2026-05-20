"""
╔══════════════════════════════════════════════════════╗
║   UPI Fraud Detection — ML API v3.0                  ║
║                                                      ║
║   FastAPI application with:                          ║
║   • XGBoost model (28+ features)                     ║
║   • Structured logging                               ║
║   • Request timing middleware                        ║
║   • Global error handlers                            ║
║   • Startup/shutdown lifecycle                       ║
║   • Batch prediction support                         ║
║   • Hot model reload                                 ║
║                                                      ║
║   Start:                                             ║
║     uvicorn app.main:app --reload --port 8000        ║
║                                                      ║
║   Docs:                                              ║
║     http://localhost:8000/docs                        ║
╚══════════════════════════════════════════════════════╝
"""

import os
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from app.routes.prediction import router as prediction_router
from app.services.fraud_detector import fraud_detector
from app.middleware import RequestLoggingMiddleware
from app.exceptions import (
    MLServiceError,
    ml_service_error_handler,
    validation_error_handler,
    generic_error_handler,
)
from app.utils.logger import setup_logging, get_logger

# ── Initialize logging FIRST ─────────────────────────────
setup_logging(level="INFO")
logger = get_logger(__name__)

# Track API start time for uptime calculation
_start_time = time.time()


# ═══════════════════════════════════════════════════════════
# LIFECYCLE: Startup & Shutdown
# ═══════════════════════════════════════════════════════════

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifecycle manager.
    - Startup: log status, verify model
    - Shutdown: cleanup resources
    """
    # ── STARTUP ───────────────────────────────────────────
    logger.info("=" * 55)
    logger.info("UPI Fraud Detection ML API v3.0 starting...")
    logger.info("=" * 55)

    if fraud_detector.model_loaded:
        logger.info(
            f"Model ready: XGBoost with "
            f"{len(fraud_detector.feature_columns)} features"
        )
    else:
        logger.warning(
            "No trained model found! Using rule-based fallback. "
            "Run 'python train_model.py' to train the XGBoost model."
        )

    logger.info("API startup complete — accepting requests")

    yield  # Application runs here

    # ── SHUTDOWN ──────────────────────────────────────────
    logger.info(
        f"Shutting down... Served {fraud_detector.predictions_served} "
        f"predictions during this session."
    )
    logger.info("Goodbye!")


# ═══════════════════════════════════════════════════════════
# CREATE APP
# ═══════════════════════════════════════════════════════════

app = FastAPI(
    title="UPI Fraud Detection ML API",
    description=(
        "Real-time ML-powered fraud detection for UPI transactions.\n\n"
        "## Features\n"
        "- **XGBoost model** with 28+ engineered features\n"
        "- **Behavioral analytics**: velocity, device diversity, sender patterns\n"
        "- **SMOTE** oversampling for class imbalance\n"
        "- **Batch prediction** for bulk screening\n"
        "- **Hot reload** — swap models without downtime\n\n"
        "## Quick Start\n"
        "```bash\n"
        "# Train model\n"
        "python train_model.py\n\n"
        "# Start API\n"
        "uvicorn app.main:app --reload --port 8000\n"
        "```"
    ),
    version="3.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)


# ═══════════════════════════════════════════════════════════
# MIDDLEWARE
# ═══════════════════════════════════════════════════════════

# Request logging (must be added before CORS)
app.add_middleware(RequestLoggingMiddleware)

# CORS — allow frontend and backend origins (env-configurable for production)
_default_origins = [
    "http://localhost:5173",   # React frontend
    "http://localhost:5000",   # Express backend
    "http://localhost:3000",   # Alternative frontend port
]
_extra_origins = [
    o.strip() for o in os.environ.get("CORS_ORIGINS", "").split(",") if o.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_default_origins + _extra_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ═══════════════════════════════════════════════════════════
# ERROR HANDLERS
# ═══════════════════════════════════════════════════════════

app.add_exception_handler(MLServiceError, ml_service_error_handler)
app.add_exception_handler(RequestValidationError, validation_error_handler)
app.add_exception_handler(Exception, generic_error_handler)


# ═══════════════════════════════════════════════════════════
# ROUTES
# ═══════════════════════════════════════════════════════════

app.include_router(prediction_router, tags=["Prediction"])


# ── Health Check ──────────────────────────────────────────

@app.get("/health", tags=["System"])
async def health_check():
    """
    Health check endpoint for monitoring and load balancers.

    Returns API status, model state, and uptime.
    """
    uptime = time.time() - _start_time
    return {
        "status": "healthy",
        "model_loaded": fraud_detector.model_loaded,
        "model_version": fraud_detector.model_version,
        "features_count": (
            len(fraud_detector.feature_columns)
            if fraud_detector.feature_columns else 0
        ),
        "uptime_seconds": round(uptime, 1),
        "predictions_served": fraud_detector.predictions_served,
    }


# ── Root ──────────────────────────────────────────────────

@app.get("/", tags=["System"])
async def root():
    """API information and available endpoints."""
    return {
        "name": "UPI Fraud Detection ML API",
        "version": "3.0.0",
        "model": (
            "XGBoost" if fraud_detector.model_loaded
            else "Rule-based (fallback — run train_model.py)"
        ),
        "predictions_served": fraud_detector.predictions_served,
        "endpoints": {
            "docs": "GET /docs",
            "health": "GET /health",
            "predict": "POST /predict",
            "batch_predict": "POST /predict/batch",
            "model_info": "GET /model/info",
            "model_reload": "POST /model/reload",
        },
    }
