"""
Fraud Detection Service (v3.0)
===============================

Production-quality ML prediction engine with:
  - Structured logging (no more print statements)
  - Prediction counter for monitoring
  - Hot-reload: swap model without restarting the API
  - Graceful fallback to rule-based scoring
  - Thread-safe singleton pattern
"""

import time
import numpy as np
import joblib
from pathlib import Path
from datetime import datetime
from app.utils.logger import get_logger
from app.exceptions import PredictionError

logger = get_logger(__name__)


class FraudDetector:
    """ML-powered UPI fraud detection engine."""

    def __init__(self):
        self.model = None
        self.scaler = None
        self.feature_columns = None
        self.model_loaded = False
        self.model_version = "3.0.0"
        self.predictions_served = 0
        self._base_path = Path(__file__).parent.parent / "models"
        self._load_artifacts()

    # ═══════════════════════════════════════════════════════
    # MODEL LOADING
    # ═══════════════════════════════════════════════════════

    def _load_artifacts(self):
        """Load the trained model, scaler, and feature columns from disk."""
        model_path = self._base_path / "fraud_model.pkl"
        scaler_path = self._base_path / "scaler.pkl"
        features_path = self._base_path / "feature_columns.pkl"

        try:
            if model_path.exists() and scaler_path.exists() and features_path.exists():
                self.model = joblib.load(model_path)
                self.scaler = joblib.load(scaler_path)
                self.feature_columns = joblib.load(features_path)
                self.model_loaded = True
                logger.info(
                    f"ML artifacts loaded — model={model_path.name}, "
                    f"scaler={scaler_path.name}, features={len(self.feature_columns)}"
                )
            else:
                missing = []
                if not model_path.exists():
                    missing.append("fraud_model.pkl")
                if not scaler_path.exists():
                    missing.append("scaler.pkl")
                if not features_path.exists():
                    missing.append("feature_columns.pkl")
                logger.warning(
                    f"Missing ML artifacts: {', '.join(missing)}. "
                    f"Using rule-based fallback. Run 'python train_model.py' to train."
                )
                self.model_loaded = False
        except Exception as e:
            logger.error(f"Failed to load ML artifacts: {e}", exc_info=True)
            self.model_loaded = False

    def reload_model(self) -> dict:
        """
        Hot-reload: re-read model artifacts from disk without restarting.
        Useful after re-training the model.

        Returns:
            dict with reload status
        """
        logger.info("Reloading ML model artifacts from disk...")
        old_loaded = self.model_loaded

        try:
            self._load_artifacts()
            status = "reloaded" if self.model_loaded else "fallback"
            logger.info(
                f"Model reload complete — status={status}, "
                f"was_loaded={old_loaded}, now_loaded={self.model_loaded}"
            )
            return {
                "success": True,
                "message": f"Model {status} successfully",
                "model_loaded": self.model_loaded,
                "model_version": self.model_version,
                "features_count": len(self.feature_columns) if self.feature_columns else 0,
            }
        except Exception as e:
            logger.error(f"Model reload failed: {e}", exc_info=True)
            return {
                "success": False,
                "message": f"Reload failed: {str(e)}",
                "model_loaded": self.model_loaded,
                "model_version": self.model_version,
                "features_count": len(self.feature_columns) if self.feature_columns else 0,
            }

    # ═══════════════════════════════════════════════════════
    # PREDICTION
    # ═══════════════════════════════════════════════════════

    def predict(self, transaction: dict) -> dict:
        """
        Predict whether a UPI transaction is fraudulent.

        Args:
            transaction: dict with keys — amount, sender_upi, receiver_upi,
                         transaction_type, sender_balance_before, receiver_balance_before

        Returns:
            dict with — is_fraud, fraud_probability, confidence, risk_level, features_used

        Raises:
            PredictionError: If the prediction pipeline fails
        """
        start_time = time.perf_counter()

        try:
            # Extract and engineer features
            features = self._extract_features(transaction)

            # Run prediction
            if self.model_loaded:
                probability = self._ml_predict(features)
                method = "xgboost"
            else:
                probability = self._rule_based_predict(features)
                method = "rule-based"

            # Determine fraud status and risk level
            is_fraud = probability >= 0.5
            confidence = max(probability, 1 - probability)

            if probability < 0.3:
                risk_level = "LOW"
            elif probability < 0.7:
                risk_level = "MEDIUM"
            else:
                risk_level = "HIGH"

            # Update counter
            self.predictions_served += 1
            elapsed = (time.perf_counter() - start_time) * 1000

            # Log the prediction
            log_level = logger.warning if is_fraud else logger.debug
            log_level(
                f"Prediction #{self.predictions_served}: "
                f"amount=₹{transaction.get('amount', 0):,.0f}, "
                f"fraud={is_fraud}, prob={probability:.4f}, "
                f"risk={risk_level}, method={method}, "
                f"time={elapsed:.1f}ms"
            )

            return {
                "is_fraud": bool(is_fraud),
                "fraud_probability": round(float(probability), 4),
                "confidence": round(float(confidence), 4),
                "risk_level": risk_level,
                "features_used": {
                    k: round(v, 4) if isinstance(v, float) else v
                    for k, v in features.items()
                },
            }

        except Exception as e:
            logger.error(
                f"Prediction failed for transaction: {transaction}",
                exc_info=True,
            )
            raise PredictionError(f"Prediction pipeline error: {str(e)}")

    # ═══════════════════════════════════════════════════════
    # FEATURE EXTRACTION
    # ═══════════════════════════════════════════════════════

    def _extract_features(self, txn: dict) -> dict:
        """
        Extract all 28+ features from a single transaction.
        Mirrors the feature engineering pipeline used during training.
        """
        amount = float(txn.get("amount", 0))
        sender_bal = float(txn.get("sender_balance_before", 0))
        receiver_bal = float(txn.get("receiver_balance_before", 0))
        txn_type = txn.get("transaction_type", "P2P")
        now = datetime.now()

        # ── Amount features ───────────────────────────────
        amount_log = float(np.log1p(amount))
        is_high = 1 if amount > 10000 else 0
        is_very_high = 1 if amount > 50000 else 0
        is_round = 1 if (amount % 1000 == 0 or amount % 500 == 0) else 0

        # ── Balance features ──────────────────────────────
        ratio = amount / sender_bal if sender_bal > 0 else 10.0
        balance_after = sender_bal - amount
        balance_negative = 1 if balance_after < 0 else 0
        pct_spent = min((amount / sender_bal * 100) if sender_bal > 0 else 100.0, 200.0)
        receiver_log = float(np.log1p(receiver_bal))
        balance_diff = sender_bal - receiver_bal

        # ── Time features ─────────────────────────────────
        hour = now.hour
        dow = now.weekday()
        is_night = 1 if 1 <= hour <= 5 else 0
        is_weekend = 1 if dow >= 5 else 0
        is_early = 1 if hour < 7 else 0
        hour_sin = float(np.sin(2 * np.pi * hour / 24))
        hour_cos = float(np.cos(2 * np.pi * hour / 24))
        dow_sin = float(np.sin(2 * np.pi * dow / 7))
        dow_cos = float(np.cos(2 * np.pi * dow / 7))

        # ── Behavioral features (defaults for single-txn API call) ─
        sender_txn_count = 0
        sender_avg_amount = amount
        amount_vs_avg = 1.0
        last_txn_time = 999999.0
        is_rapid = 0
        unique_devices = 1
        unique_receivers = 1
        unique_locations = 1

        # ── Encoding ──────────────────────────────────────
        type_map = {"P2P": 0, "P2M": 1, "BILL": 2, "RECHARGE": 3}
        txn_type_encoded = type_map.get(txn_type, 0)
        location_encoded = 0

        return {
            "transaction_amount": amount,
            "amount_log": amount_log,
            "is_high_amount": is_high,
            "is_very_high_amount": is_very_high,
            "amount_is_round": is_round,
            "amount_to_balance_ratio": ratio,
            "balance_after_negative": balance_negative,
            "balance_pct_spent": pct_spent,
            "receiver_balance_log": receiver_log,
            "balance_diff": balance_diff,
            "hour": hour,
            "day_of_week": dow,
            "is_night": is_night,
            "is_weekend": is_weekend,
            "is_early_morning": is_early,
            "hour_sin": hour_sin,
            "hour_cos": hour_cos,
            "dow_sin": dow_sin,
            "dow_cos": dow_cos,
            "sender_txn_count": sender_txn_count,
            "sender_avg_amount": sender_avg_amount,
            "amount_vs_sender_avg": amount_vs_avg,
            "sender_last_txn_time": last_txn_time,
            "is_rapid_txn": is_rapid,
            "sender_unique_devices": unique_devices,
            "sender_unique_receivers": unique_receivers,
            "sender_unique_locations": unique_locations,
            "transaction_type_encoded": txn_type_encoded,
            "location_encoded": location_encoded,
        }

    def _ml_predict(self, features: dict) -> float:
        """Use the trained XGBoost model for prediction."""
        feature_values = [features.get(col, 0) for col in self.feature_columns]
        feature_array = np.array([feature_values])
        feature_scaled = self.scaler.transform(feature_array)
        probability = float(self.model.predict_proba(feature_scaled)[0][1])
        return probability

    def _rule_based_predict(self, features: dict) -> float:
        """Fallback rule-based scoring when no ML model is loaded."""
        score = 0.0

        if features.get("is_very_high_amount"):
            score += 0.30
        elif features.get("is_high_amount"):
            score += 0.12

        if features.get("balance_after_negative"):
            score += 0.25

        ratio = features.get("amount_to_balance_ratio", 0)
        if ratio > 0.9:
            score += 0.20
        elif ratio > 0.5:
            score += 0.08

        if features.get("is_night"):
            score += 0.10

        if features.get("amount_is_round"):
            score += 0.03

        return min(max(score, 0.0), 1.0)


# ── Singleton (loaded once at import time) ────────────────
fraud_detector = FraudDetector()
