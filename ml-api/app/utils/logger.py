"""
Structured Logging Configuration
==================================

Sets up Python's logging module with:
  - Console handler with colored, readable output
  - File handler that writes to logs/ml_api.log
  - Separate log levels for our code vs. library noise
  - Structured format: timestamp | level | module | message

Usage:
    from app.utils.logger import get_logger
    logger = get_logger(__name__)
    logger.info("Server started")
    logger.warning("Model not found, using fallback")
    logger.error("Prediction failed", exc_info=True)
"""

import os
import sys
import logging
from pathlib import Path

# Create logs directory
LOG_DIR = Path(__file__).parent.parent.parent / "logs"
LOG_DIR.mkdir(exist_ok=True)
LOG_FILE = LOG_DIR / "ml_api.log"

# ── Format strings ────────────────────────────────────────
CONSOLE_FORMAT = "%(asctime)s │ %(levelname)-8s │ %(name)-25s │ %(message)s"
FILE_FORMAT = "%(asctime)s | %(levelname)-8s | %(name)s | %(funcName)s:%(lineno)d | %(message)s"
DATE_FORMAT = "%Y-%m-%d %H:%M:%S"


def setup_logging(level: str = "INFO"):
    """
    Configure logging for the entire application.
    Call this once at startup (in main.py).
    """
    log_level = getattr(logging, level.upper(), logging.INFO)

    # ── Root logger ───────────────────────────────────────
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)

    # Clear existing handlers (prevents duplicates on reload)
    root_logger.handlers.clear()

    # ── Console handler (stdout) ──────────────────────────
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    console_handler.setFormatter(logging.Formatter(CONSOLE_FORMAT, DATE_FORMAT))
    root_logger.addHandler(console_handler)

    # ── File handler (rotating would be better in production) ─
    file_handler = logging.FileHandler(LOG_FILE, encoding="utf-8")
    file_handler.setLevel(logging.DEBUG)  # File captures everything
    file_handler.setFormatter(logging.Formatter(FILE_FORMAT, DATE_FORMAT))
    root_logger.addHandler(file_handler)

    # ── Reduce noise from libraries ───────────────────────
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.error").setLevel(logging.INFO)
    logging.getLogger("watchfiles").setLevel(logging.WARNING)

    root_logger.info(f"Logging initialized (level={level}, file={LOG_FILE})")


def get_logger(name: str) -> logging.Logger:
    """
    Get a named logger for a specific module.

    Args:
        name: Usually __name__ (e.g., "app.services.fraud_detector")

    Returns:
        logging.Logger instance
    """
    return logging.getLogger(name)
