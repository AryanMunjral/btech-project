"""
Synthetic UPI Transaction Dataset Generator
============================================

Generates realistic UPI transaction data with the required columns:
  - transaction_amount    : Amount in INR
  - transaction_type      : P2P, P2M, BILL, RECHARGE
  - sender_id             : Unique sender identifier
  - receiver_id           : Unique receiver identifier
  - timestamp             : Transaction datetime
  - device_id             : Device fingerprint
  - location              : City name
  - is_fraud              : Target label (0 or 1)

Also includes supplementary columns for richer feature engineering:
  - sender_balance_before : Sender's balance before transaction
  - receiver_balance_before : Receiver's balance before transaction

Fraud patterns simulated:
  1. HIGH_AMOUNT    — Unusually large transaction relative to balance
  2. BALANCE_DRAIN  — Sender drains 85-120% of their balance
  3. RAPID_BURST    — Multiple transactions in a short time (same sender)
  4. NEW_DEVICE     — Transaction from an unfamiliar device
  5. ODD_HOURS      — Transaction between 1 AM - 5 AM
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta

# ── Constants ─────────────────────────────────────────────
INDIAN_CITIES = [
    "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai",
    "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Lucknow",
    "Surat", "Nagpur", "Indore", "Bhopal", "Patna",
    "Chandigarh", "Coimbatore", "Kochi", "Guwahati", "Vizag",
]

TRANSACTION_TYPES = ["P2P", "P2M", "BILL", "RECHARGE"]
LEGIT_TYPE_PROBS = [0.40, 0.35, 0.15, 0.10]  # Legitimate distribution
FRAUD_TYPE_PROBS = [0.55, 0.25, 0.10, 0.10]   # Fraud favors P2P


def generate_dataset(
    n_samples: int = 50000,
    fraud_ratio: float = 0.08,
    seed: int = 42,
) -> pd.DataFrame:
    """
    Generate a complete synthetic UPI transaction dataset.

    Args:
        n_samples:   Total number of transactions to generate
        fraud_ratio: Fraction of fraudulent transactions (default 8%)
        seed:        Random seed for reproducibility

    Returns:
        pd.DataFrame with all columns ready for feature engineering
    """
    np.random.seed(seed)

    n_fraud = int(n_samples * fraud_ratio)
    n_legit = n_samples - n_fraud

    print(f"📊 Generating dataset: {n_samples:,} total ({n_legit:,} legit, {n_fraud:,} fraud)")

    # ── Generate pool of senders / receivers / devices ────
    n_senders = int(n_samples * 0.3)    # ~30% unique senders
    n_receivers = int(n_samples * 0.4)  # ~40% unique receivers
    n_devices = int(n_samples * 0.25)   # ~25% unique devices

    sender_ids = [f"SENDER_{i:05d}" for i in range(n_senders)]
    receiver_ids = [f"RECV_{i:05d}" for i in range(n_receivers)]
    device_ids = [f"DEV_{i:06d}" for i in range(n_devices)]

    # ── Generate timestamps over 90 days ──────────────────
    end_date = datetime(2026, 5, 15, 23, 59, 59)
    start_date = end_date - timedelta(days=90)

    # ── Legitimate Transactions ───────────────────────────
    legit_data = _generate_legit(
        n_legit, sender_ids, receiver_ids, device_ids,
        start_date, end_date,
    )

    # ── Fraudulent Transactions ───────────────────────────
    fraud_data = _generate_fraud(
        n_fraud, sender_ids, receiver_ids, device_ids,
        start_date, end_date,
    )

    # ── Combine, shuffle, and return ──────────────────────
    df = pd.concat([legit_data, fraud_data], ignore_index=True)
    df = df.sample(frac=1, random_state=seed).reset_index(drop=True)

    # Introduce realistic missing values (~2% of some columns)
    df = _introduce_missing_values(df)

    print(f"   ✅ Dataset shape: {df.shape}")
    print(f"   ✅ Fraud rate: {df['is_fraud'].mean() * 100:.2f}%")
    print(f"   ✅ Missing values: {df.isnull().sum().sum()} total")

    return df


def _generate_legit(n, senders, receivers, devices, start, end):
    """Generate legitimate transaction records."""
    records = []
    for _ in range(n):
        # Normal business hours weighted timestamps
        ts = _random_timestamp(start, end, night_bias=0.05)

        # Moderate amounts (exponential distribution centered around ₹1,500)
        amount = np.random.exponential(scale=1500) + 10
        amount = min(amount, 100000)  # Cap at ₹1L

        sender_bal = np.random.uniform(5000, 300000)
        receiver_bal = np.random.uniform(1000, 200000)

        records.append({
            "transaction_amount": round(amount, 2),
            "transaction_type": np.random.choice(TRANSACTION_TYPES, p=LEGIT_TYPE_PROBS),
            "sender_id": np.random.choice(senders),
            "receiver_id": np.random.choice(receivers),
            "timestamp": ts,
            "device_id": np.random.choice(devices),
            "location": np.random.choice(INDIAN_CITIES),
            "sender_balance_before": round(sender_bal, 2),
            "receiver_balance_before": round(receiver_bal, 2),
            "is_fraud": 0,
        })

    return pd.DataFrame(records)


def _generate_fraud(n, senders, receivers, devices, start, end):
    """
    Generate fraudulent transactions using 5 distinct fraud patterns.
    Each pattern has different statistical signatures.
    """
    records = []
    patterns = ["HIGH_AMOUNT", "BALANCE_DRAIN", "RAPID_BURST", "NEW_DEVICE", "ODD_HOURS"]
    pattern_probs = [0.25, 0.25, 0.20, 0.15, 0.15]

    for _ in range(n):
        pattern = np.random.choice(patterns, p=pattern_probs)

        if pattern == "HIGH_AMOUNT":
            # Unusually large amounts
            amount = np.random.uniform(25000, 100000)
            sender_bal = np.random.uniform(1000, 30000)  # Low balance
            ts = _random_timestamp(start, end, night_bias=0.3)
            location = np.random.choice(INDIAN_CITIES)

        elif pattern == "BALANCE_DRAIN":
            # Drain 85-120% of sender's balance
            sender_bal = np.random.uniform(5000, 80000)
            amount = sender_bal * np.random.uniform(0.85, 1.2)
            ts = _random_timestamp(start, end, night_bias=0.25)
            location = np.random.choice(INDIAN_CITIES)

        elif pattern == "RAPID_BURST":
            # Multiple transactions, smaller amounts but suspicious
            amount = np.random.uniform(3000, 30000)
            sender_bal = np.random.uniform(10000, 100000)
            ts = _random_timestamp(start, end, night_bias=0.15)
            location = np.random.choice(INDIAN_CITIES)

        elif pattern == "NEW_DEVICE":
            # Transaction from a device not in the normal pool
            amount = np.random.uniform(5000, 60000)
            sender_bal = np.random.uniform(8000, 150000)
            ts = _random_timestamp(start, end, night_bias=0.2)
            location = np.random.choice(INDIAN_CITIES)

        else:  # ODD_HOURS
            # Transactions during 1 AM - 5 AM
            amount = np.random.uniform(5000, 50000)
            sender_bal = np.random.uniform(5000, 100000)
            # Force timestamp into 1-5 AM window
            base = _random_timestamp(start, end, night_bias=0.0)
            ts = base.replace(hour=np.random.randint(1, 5))
            location = np.random.choice(INDIAN_CITIES)

        receiver_bal = np.random.uniform(0, 30000)

        records.append({
            "transaction_amount": round(amount, 2),
            "transaction_type": np.random.choice(TRANSACTION_TYPES, p=FRAUD_TYPE_PROBS),
            "sender_id": np.random.choice(senders),
            "receiver_id": np.random.choice(receivers),
            "timestamp": ts,
            "device_id": f"DEV_{np.random.randint(900000, 999999)}",  # Often new devices
            "location": location,
            "sender_balance_before": round(sender_bal, 2),
            "receiver_balance_before": round(receiver_bal, 2),
            "is_fraud": 1,
        })

    return pd.DataFrame(records)


def _random_timestamp(start, end, night_bias=0.05):
    """
    Generate a random timestamp between start and end.
    night_bias: probability of generating a 1-5 AM timestamp.
    """
    delta = end - start
    random_seconds = np.random.randint(0, int(delta.total_seconds()))
    ts = start + timedelta(seconds=random_seconds)

    # Bias: most legit transactions happen during day
    if np.random.random() < night_bias:
        ts = ts.replace(hour=np.random.randint(1, 5))
    else:
        ts = ts.replace(hour=np.random.choice(
            range(6, 24),
            p=_daytime_hour_probs(),
        ))

    return ts


def _daytime_hour_probs():
    """Probability distribution for hours 6-23 (realistic UPI usage)."""
    # Peak: 10-12 AM, 5-8 PM. Low: early morning, late night
    probs = [
        0.02, 0.03, 0.05, 0.07,   # 6-9
        0.09, 0.10, 0.10, 0.09,   # 10-13
        0.08, 0.07, 0.08, 0.09,   # 14-17
        0.06, 0.04, 0.02, 0.01,   # 18-21
        0.005, 0.005,              # 22-23
    ]
    total = sum(probs)
    return [p / total for p in probs]


def _introduce_missing_values(df, pct=0.02):
    """
    Introduce realistic missing values into the dataset.
    Real data is never perfectly clean!
    """
    n = len(df)
    n_missing = int(n * pct)

    # device_id: sometimes missing (user privacy)
    mask = np.random.choice(df.index, size=n_missing, replace=False)
    df.loc[mask, "device_id"] = np.nan

    # location: sometimes missing (GPS off)
    mask = np.random.choice(df.index, size=int(n_missing * 0.5), replace=False)
    df.loc[mask, "location"] = np.nan

    # receiver_balance_before: sometimes unavailable
    mask = np.random.choice(df.index, size=int(n_missing * 0.3), replace=False)
    df.loc[mask, "receiver_balance_before"] = np.nan

    return df


# ── CLI entry point ───────────────────────────────────────
if __name__ == "__main__":
    import os
    os.makedirs("data", exist_ok=True)
    df = generate_dataset(n_samples=50000, fraud_ratio=0.08)
    df.to_csv("data/upi_transactions.csv", index=False)
    print(f"\n💾 Saved to data/upi_transactions.csv")
    print(f"\nSample rows:\n{df.head()}")
