"""
Feature Engineering Pipeline
=============================

Transforms raw UPI transaction data into ML-ready features.

Feature categories:
  1. AMOUNT FEATURES     — Raw amount, log-amount, thresholds
  2. BALANCE FEATURES    — Ratios, remaining balance
  3. TIME FEATURES       — Hour, day-of-week, is_night, is_weekend
  4. BEHAVIORAL FEATURES — Sender frequency, velocity, device uniqueness
  5. ENCODED FEATURES    — Label-encoded categorical columns

All features are designed to capture real fraud patterns:
  - Unusual transaction amounts relative to balance
  - Transactions at odd hours (1-5 AM)
  - High transaction velocity (many transactions quickly)
  - New or unusual devices
  - Draining entire balance in one go
"""

import numpy as np
import pandas as pd


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Main function: takes raw dataset and returns feature-enriched DataFrame.

    Args:
        df: Raw transaction DataFrame with columns:
            transaction_amount, transaction_type, sender_id, receiver_id,
            timestamp, device_id, location, sender_balance_before,
            receiver_balance_before, is_fraud

    Returns:
        DataFrame with original columns + all engineered features
    """
    df = df.copy()

    # Ensure timestamp is datetime
    df["timestamp"] = pd.to_datetime(df["timestamp"])

    # Sort by timestamp for time-based features
    df = df.sort_values("timestamp").reset_index(drop=True)

    print("🔧 Engineering features...")

    # ── 1. Amount Features ────────────────────────────────
    df = _amount_features(df)

    # ── 2. Balance Features ───────────────────────────────
    df = _balance_features(df)

    # ── 3. Time Features ──────────────────────────────────
    df = _time_features(df)

    # ── 4. Behavioral / Aggregation Features ──────────────
    df = _behavioral_features(df)

    # ── 5. Label Encoding ─────────────────────────────────
    df = _encode_categoricals(df)

    print(f"   ✅ Total features: {len(get_feature_columns(df))}")
    return df


# ═══════════════════════════════════════════════════════════
# 1. AMOUNT FEATURES
# ═══════════════════════════════════════════════════════════

def _amount_features(df):
    """Features derived from the transaction amount."""

    # Log-transformed amount (reduces skewness)
    df["amount_log"] = np.log1p(df["transaction_amount"])

    # Amount thresholds (common fraud patterns)
    df["is_high_amount"] = (df["transaction_amount"] > 10000).astype(int)
    df["is_very_high_amount"] = (df["transaction_amount"] > 50000).astype(int)

    # Amount rounded to nearest 1000 (fraud often uses round numbers)
    df["amount_is_round"] = (
        (df["transaction_amount"] % 1000 == 0) |
        (df["transaction_amount"] % 500 == 0)
    ).astype(int)

    print("   ✅ Amount features added")
    return df


# ═══════════════════════════════════════════════════════════
# 2. BALANCE FEATURES
# ═══════════════════════════════════════════════════════════

def _balance_features(df):
    """Features derived from sender/receiver balance."""

    # Amount to balance ratio (key fraud signal)
    df["amount_to_balance_ratio"] = np.where(
        df["sender_balance_before"] > 0,
        df["transaction_amount"] / df["sender_balance_before"],
        10.0  # Very high ratio if balance is 0
    )

    # Would the transaction drain the account?
    df["balance_after_txn"] = df["sender_balance_before"] - df["transaction_amount"]
    df["balance_after_negative"] = (df["balance_after_txn"] < 0).astype(int)

    # Percentage of balance being spent
    df["balance_pct_spent"] = np.where(
        df["sender_balance_before"] > 0,
        (df["transaction_amount"] / df["sender_balance_before"]) * 100,
        100.0
    )
    df["balance_pct_spent"] = df["balance_pct_spent"].clip(upper=200)  # Cap at 200%

    # Receiver balance features
    df["receiver_balance_log"] = np.log1p(df["receiver_balance_before"].fillna(0))

    # Balance difference between sender and receiver
    df["balance_diff"] = (
        df["sender_balance_before"].fillna(0) -
        df["receiver_balance_before"].fillna(0)
    )

    print("   ✅ Balance features added")
    return df


# ═══════════════════════════════════════════════════════════
# 3. TIME FEATURES
# ═══════════════════════════════════════════════════════════

def _time_features(df):
    """Features derived from the transaction timestamp."""

    df["hour"] = df["timestamp"].dt.hour
    df["day_of_week"] = df["timestamp"].dt.dayofweek  # Mon=0, Sun=6
    df["day_of_month"] = df["timestamp"].dt.day

    # Is it night time? (1 AM - 5 AM — high fraud window)
    df["is_night"] = ((df["hour"] >= 1) & (df["hour"] <= 5)).astype(int)

    # Is it weekend? (Sat/Sun)
    df["is_weekend"] = (df["day_of_week"] >= 5).astype(int)

    # Is it early morning (before 7 AM)?
    df["is_early_morning"] = (df["hour"] < 7).astype(int)

    # Cyclical encoding for hour (captures 23:00 → 00:00 continuity)
    df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24)
    df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24)

    # Cyclical encoding for day of week
    df["dow_sin"] = np.sin(2 * np.pi * df["day_of_week"] / 7)
    df["dow_cos"] = np.cos(2 * np.pi * df["day_of_week"] / 7)

    print("   ✅ Time features added")
    return df


# ═══════════════════════════════════════════════════════════
# 4. BEHAVIORAL / AGGREGATION FEATURES
# ═══════════════════════════════════════════════════════════

def _behavioral_features(df):
    """
    Behavioral analytics — features based on sender's historical patterns.
    These are the most powerful fraud indicators.
    """

    # ── Sender transaction frequency (rolling count) ──────
    # How many transactions has this sender made?
    sender_counts = df.groupby("sender_id").cumcount()
    df["sender_txn_count"] = sender_counts

    # ── Sender average amount ─────────────────────────────
    # Running average of sender's transaction amounts
    df["sender_avg_amount"] = (
        df.groupby("sender_id")["transaction_amount"]
        .expanding()
        .mean()
        .reset_index(level=0, drop=True)
    )

    # How far is this transaction from sender's average?
    df["amount_vs_sender_avg"] = np.where(
        df["sender_avg_amount"] > 0,
        df["transaction_amount"] / df["sender_avg_amount"],
        1.0
    )

    # ── Sender transaction velocity ───────────────────────
    # Time since sender's last transaction (in minutes)
    df["sender_last_txn_time"] = (
        df.groupby("sender_id")["timestamp"]
        .diff()
        .dt.total_seconds()
        .fillna(999999)  # First transaction = very large
        / 60  # Convert to minutes
    )
    df["is_rapid_txn"] = (df["sender_last_txn_time"] < 5).astype(int)  # < 5 min gap

    # ── Unique devices per sender ─────────────────────────
    # Track how many unique devices each sender has used
    def _expanding_nunique(series):
        """Compute expanding unique count for any dtype (incl. strings)."""
        result = []
        seen = set()
        for val in series:
            seen.add(val)
            result.append(len(seen))
        return pd.Series(result, index=series.index)

    device_counts = (
        df.groupby("sender_id")["device_id"]
        .apply(_expanding_nunique)
        .reset_index(level=0, drop=True)
    )
    df["sender_unique_devices"] = device_counts.fillna(1)

    # ── Unique receivers per sender ───────────────────────
    receiver_diversity = (
        df.groupby("sender_id")["receiver_id"]
        .apply(_expanding_nunique)
        .reset_index(level=0, drop=True)
    )
    df["sender_unique_receivers"] = receiver_diversity.fillna(1)

    # ── Location features ─────────────────────────────────
    # Unique locations per sender
    location_counts = (
        df.groupby("sender_id")["location"]
        .apply(_expanding_nunique)
        .reset_index(level=0, drop=True)
    )
    df["sender_unique_locations"] = location_counts.fillna(1)

    print("   ✅ Behavioral features added")
    return df


# ═══════════════════════════════════════════════════════════
# 5. LABEL ENCODING
# ═══════════════════════════════════════════════════════════

def _encode_categoricals(df):
    """Label-encode categorical columns to numeric values."""

    # Transaction type encoding
    type_map = {"P2P": 0, "P2M": 1, "BILL": 2, "RECHARGE": 3}
    df["transaction_type_encoded"] = df["transaction_type"].map(type_map).fillna(0).astype(int)

    # Location encoding (frequency-based: more common cities get lower codes)
    if "location" in df.columns:
        location_freq = df["location"].value_counts()
        location_map = {loc: i for i, loc in enumerate(location_freq.index)}
        df["location_encoded"] = df["location"].map(location_map).fillna(-1).astype(int)

    print("   ✅ Categorical encoding done")
    return df


# ═══════════════════════════════════════════════════════════
# UTILITY: Get list of feature columns for training
# ═══════════════════════════════════════════════════════════

# These are the columns the ML model expects as input
FEATURE_COLUMNS = [
    # Amount features
    "transaction_amount", "amount_log", "is_high_amount", "is_very_high_amount",
    "amount_is_round",
    # Balance features
    "amount_to_balance_ratio", "balance_after_negative", "balance_pct_spent",
    "receiver_balance_log", "balance_diff",
    # Time features
    "hour", "day_of_week", "is_night", "is_weekend", "is_early_morning",
    "hour_sin", "hour_cos", "dow_sin", "dow_cos",
    # Behavioral features
    "sender_txn_count", "sender_avg_amount", "amount_vs_sender_avg",
    "sender_last_txn_time", "is_rapid_txn",
    "sender_unique_devices", "sender_unique_receivers", "sender_unique_locations",
    # Encoded categoricals
    "transaction_type_encoded", "location_encoded",
]

TARGET_COLUMN = "is_fraud"


def get_feature_columns(df=None):
    """Return the list of feature columns used by the model."""
    if df is not None:
        # Return only columns that exist in the DataFrame
        return [c for c in FEATURE_COLUMNS if c in df.columns]
    return FEATURE_COLUMNS
