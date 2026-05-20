"""
Request Logging Middleware
===========================

Logs every incoming HTTP request with:
  - Method + path
  - Response status code
  - Processing time in milliseconds
  - Client IP address

This gives you a clear picture of API usage in the logs.

Example log output:
  POST /predict → 200 (23.4ms) from 127.0.0.1
  GET  /health  → 200 (1.2ms) from 127.0.0.1
"""

import time
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from app.utils.logger import get_logger

logger = get_logger("app.middleware.request")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware that logs every request with timing information."""

    async def dispatch(self, request: Request, call_next) -> Response:
        # Record start time
        start_time = time.perf_counter()

        # Get client IP
        client_ip = request.client.host if request.client else "unknown"

        # Process the request
        try:
            response = await call_next(request)
        except Exception as exc:
            # Log failed requests
            elapsed = (time.perf_counter() - start_time) * 1000
            logger.error(
                f"{request.method} {request.url.path} → ERROR ({elapsed:.1f}ms) "
                f"from {client_ip} | {type(exc).__name__}: {exc}"
            )
            raise

        # Calculate processing time
        elapsed = (time.perf_counter() - start_time) * 1000

        # Add timing header to response
        response.headers["X-Process-Time-Ms"] = f"{elapsed:.1f}"

        # Log the request
        log_msg = (
            f"{request.method:6s} {request.url.path} → {response.status_code} "
            f"({elapsed:.1f}ms) from {client_ip}"
        )

        if response.status_code >= 500:
            logger.error(log_msg)
        elif response.status_code >= 400:
            logger.warning(log_msg)
        else:
            logger.info(log_msg)

        return response
