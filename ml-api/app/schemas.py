"""
Pydantic Request/Response Schemas (v3.0)
==========================================

Defines all input validation and output serialization models.

Schemas:
  - TransactionInput     — Single prediction request
  - PredictionResponse   — Single prediction result
  - BatchInput           — Multiple transactions at once
  - BatchResponse        — Multiple results
  - HealthResponse       — Health check
  - ModelInfoResponse    — Detailed model metadata
  - ErrorResponse        — Standardized error format
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# ═══════════════════════════════════════════════════════════
# REQUEST SCHEMAS
# ═══════════════════════════════════════════════════════════

class TransactionInput(BaseModel):
    """Input schema for a single fraud prediction request."""
    amount: float = Field(
        ..., gt=0, le=10000000,
        description="Transaction amount in INR (₹1 to ₹1 Crore)"
    )
    sender_upi: str = Field(
        ..., min_length=3, max_length=100,
        description="Sender UPI ID (e.g., user@paytm)"
    )
    receiver_upi: str = Field(
        ..., min_length=3, max_length=100,
        description="Receiver UPI ID (e.g., shop@ybl)"
    )
    transaction_type: str = Field(
        default="P2P",
        description="Transaction type: P2P, P2M, BILL, RECHARGE"
    )
    sender_balance_before: float = Field(
        default=0, ge=0,
        description="Sender's account balance before this transaction"
    )
    receiver_balance_before: float = Field(
        default=0, ge=0,
        description="Receiver's account balance before this transaction"
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "amount": 5000.0,
                    "sender_upi": "user1@paytm",
                    "receiver_upi": "shop@ybl",
                    "transaction_type": "P2M",
                    "sender_balance_before": 25000.0,
                    "receiver_balance_before": 10000.0,
                }
            ]
        }
    }


class BatchInput(BaseModel):
    """Input schema for batch prediction (multiple transactions at once)."""
    transactions: list[TransactionInput] = Field(
        ..., min_length=1, max_length=100,
        description="List of transactions to analyze (max 100)"
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "transactions": [
                        {
                            "amount": 500,
                            "sender_upi": "user@paytm",
                            "receiver_upi": "shop@ybl",
                            "transaction_type": "P2M",
                            "sender_balance_before": 25000,
                            "receiver_balance_before": 100000,
                        },
                        {
                            "amount": 75000,
                            "sender_upi": "unknown@axl",
                            "receiver_upi": "suspect@ybl",
                            "transaction_type": "P2P",
                            "sender_balance_before": 8000,
                            "receiver_balance_before": 500,
                        },
                    ]
                }
            ]
        }
    }


# ═══════════════════════════════════════════════════════════
# RESPONSE SCHEMAS
# ═══════════════════════════════════════════════════════════

class PredictionResponse(BaseModel):
    """Response from a single fraud prediction."""
    is_fraud: bool = Field(description="True if predicted fraudulent")
    fraud_probability: float = Field(ge=0, le=1, description="Fraud probability (0-1)")
    confidence: float = Field(ge=0, le=1, description="Model confidence (0.5-1.0)")
    risk_level: str = Field(description="Risk level: LOW, MEDIUM, HIGH")
    features_used: dict = Field(description="All features computed for this prediction")


class BatchPredictionResult(BaseModel):
    """Single result within a batch response."""
    index: int = Field(description="Position in the input batch (0-indexed)")
    sender_upi: str
    receiver_upi: str
    amount: float
    is_fraud: bool
    fraud_probability: float
    risk_level: str


class BatchResponse(BaseModel):
    """Response from batch prediction."""
    total: int = Field(description="Total transactions processed")
    fraud_count: int = Field(description="Number flagged as fraud")
    legitimate_count: int = Field(description="Number classified as legitimate")
    processing_time_ms: float = Field(description="Total processing time in milliseconds")
    results: list[BatchPredictionResult]


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    model_loaded: bool
    model_version: str
    features_count: Optional[int] = None
    uptime_seconds: Optional[float] = None
    predictions_served: Optional[int] = None


class ModelInfoResponse(BaseModel):
    """Detailed model information."""
    model_loaded: bool
    model_version: str
    model_type: str
    features_count: int
    feature_names: list[str]
    predictions_served: int
    using_fallback: bool


class ModelReloadResponse(BaseModel):
    """Response after model reload."""
    success: bool
    message: str
    model_loaded: bool
    model_version: str
    features_count: int


class ErrorResponse(BaseModel):
    """Standardized error response format."""
    error: str
    message: str
    status_code: int
    details: Optional[list[dict]] = None
