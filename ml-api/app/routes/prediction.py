"""
Prediction Routes (v3.0)
=========================

Endpoints:
  POST /predict         — Single transaction prediction
  POST /predict/batch   — Batch prediction (up to 100 transactions)
  GET  /model/info      — Model metadata + stats
  POST /model/reload    — Hot-reload model from disk
"""

import time
from fastapi import APIRouter
from app.schemas import (
    TransactionInput,
    PredictionResponse,
    BatchInput,
    BatchResponse,
    BatchPredictionResult,
    ModelInfoResponse,
    ModelReloadResponse,
)
from app.services.fraud_detector import fraud_detector
from app.utils.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)


# ═══════════════════════════════════════════════════════════
# POST /predict — Single Transaction
# ═══════════════════════════════════════════════════════════

@router.post(
    "/predict",
    response_model=PredictionResponse,
    summary="Predict fraud for a single transaction",
    responses={
        200: {"description": "Prediction successful"},
        422: {"description": "Invalid input data"},
        500: {"description": "Prediction pipeline error"},
    },
)
async def predict_fraud(transaction: TransactionInput):
    """
    Analyze a single UPI transaction for fraud.

    The model evaluates 28+ features including:
    - **Amount analysis**: log-amount, thresholds, round-number detection
    - **Balance analysis**: spending ratio, overdraft detection
    - **Time analysis**: night hours, weekends
    - **Behavioral patterns**: transaction velocity, device diversity

    Returns a prediction with fraud probability, confidence, and risk level.
    """
    result = fraud_detector.predict(transaction.model_dump())
    return result


# ═══════════════════════════════════════════════════════════
# POST /predict/batch — Multiple Transactions
# ═══════════════════════════════════════════════════════════

@router.post(
    "/predict/batch",
    response_model=BatchResponse,
    summary="Predict fraud for multiple transactions at once",
    responses={
        200: {"description": "Batch prediction successful"},
        422: {"description": "Invalid input data"},
    },
)
async def predict_batch(batch: BatchInput):
    """
    Analyze up to 100 UPI transactions in a single API call.

    Useful for:
    - Bulk transaction screening
    - Historical data analysis
    - Dashboard batch refresh

    Returns individual results plus summary statistics.
    """
    start_time = time.perf_counter()
    results = []
    fraud_count = 0

    for i, txn in enumerate(batch.transactions):
        prediction = fraud_detector.predict(txn.model_dump())
        if prediction["is_fraud"]:
            fraud_count += 1

        results.append(BatchPredictionResult(
            index=i,
            sender_upi=txn.sender_upi,
            receiver_upi=txn.receiver_upi,
            amount=txn.amount,
            is_fraud=prediction["is_fraud"],
            fraud_probability=prediction["fraud_probability"],
            risk_level=prediction["risk_level"],
        ))

    elapsed = (time.perf_counter() - start_time) * 1000
    total = len(batch.transactions)

    logger.info(
        f"Batch prediction: {total} transactions, "
        f"{fraud_count} fraud detected, {elapsed:.1f}ms total"
    )

    return BatchResponse(
        total=total,
        fraud_count=fraud_count,
        legitimate_count=total - fraud_count,
        processing_time_ms=round(elapsed, 1),
        results=results,
    )


# ═══════════════════════════════════════════════════════════
# GET /model/info — Model Metadata
# ═══════════════════════════════════════════════════════════

@router.get(
    "/model/info",
    response_model=ModelInfoResponse,
    summary="Get ML model information and statistics",
)
async def model_info():
    """
    Returns detailed information about the currently loaded model including:
    - Model type and version
    - Number of features
    - Feature names
    - Total predictions served
    - Whether using fallback mode
    """
    return ModelInfoResponse(
        model_loaded=fraud_detector.model_loaded,
        model_version=fraud_detector.model_version,
        model_type=(
            type(fraud_detector.model).__name__
            if fraud_detector.model else "RuleBasedFallback"
        ),
        features_count=(
            len(fraud_detector.feature_columns)
            if fraud_detector.feature_columns else 0
        ),
        feature_names=fraud_detector.feature_columns or [],
        predictions_served=fraud_detector.predictions_served,
        using_fallback=not fraud_detector.model_loaded,
    )


# ═══════════════════════════════════════════════════════════
# POST /model/reload — Hot Reload Model
# ═══════════════════════════════════════════════════════════

@router.post(
    "/model/reload",
    response_model=ModelReloadResponse,
    summary="Reload model from disk (after retraining)",
)
async def reload_model():
    """
    Hot-reload the ML model from disk without restarting the API.

    Workflow:
    1. Retrain: `python train_model.py`
    2. Reload: `POST /model/reload`
    3. Verify: `GET /model/info`

    The API continues serving requests during reload.
    """
    result = fraud_detector.reload_model()
    logger.info(f"Model reload result: {result}")
    return ModelReloadResponse(**result)
