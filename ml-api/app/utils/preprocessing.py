"""
Data Preprocessing Module
==========================

Handles the messy parts of real-world data before it's ready for training:
  1. Missing value imputation
  2. Outlier capping
  3. Feature scaling (StandardScaler)
  4. Train/test split with stratification

The preprocessing pipeline is saved alongside the model so the API
can apply the exact same transformations at prediction time.
"""

import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import joblib
from pathlib import Path

from app.utils.feature_engineering import get_feature_columns, TARGET_COLUMN


def preprocess_dataset(
    df: pd.DataFrame,
    test_size: float = 0.2,
    random_state: int = 42,
) -> dict:
    """
    Full preprocessing pipeline for training data.

    Steps:
      1. Handle missing values
      2. Cap outliers
      3. Extract features + target
      4. Scale features
      5. Split into train/test

    Args:
        df: Feature-engineered DataFrame
        test_size: Fraction of data for testing
        random_state: Random seed

    Returns:
        dict with keys:
          X_train, X_test, y_train, y_test,
          feature_names, scaler
    """
    print("\n🧹 Preprocessing data...")

    # ── Step 1: Handle missing values ─────────────────────
    df = handle_missing_values(df)
    print("   ✅ Missing values handled")

    # ── Step 2: Cap outliers ──────────────────────────────
    df = cap_outliers(df)
    print("   ✅ Outliers capped")

    # ── Step 3: Extract features and target ───────────────
    feature_cols = get_feature_columns(df)
    X = df[feature_cols].copy()
    y = df[TARGET_COLUMN].copy()

    print(f"   ✅ Features: {len(feature_cols)} columns")
    print(f"   ✅ Target distribution: {y.value_counts().to_dict()}")

    # ── Step 4: Scale features ────────────────────────────
    scaler = StandardScaler()
    X_scaled = pd.DataFrame(
        scaler.fit_transform(X),
        columns=feature_cols,
        index=X.index,
    )
    print("   ✅ Features scaled (StandardScaler)")

    # ── Step 5: Train/test split (stratified) ─────────────
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y,
        test_size=test_size,
        random_state=random_state,
        stratify=y,  # Keeps the same fraud ratio in both sets
    )

    print(f"   ✅ Split: {len(X_train)} train / {len(X_test)} test")
    print(f"   ✅ Train fraud rate: {y_train.mean() * 100:.2f}%")
    print(f"   ✅ Test fraud rate:  {y_test.mean() * 100:.2f}%")

    return {
        "X_train": X_train,
        "X_test": X_test,
        "y_train": y_train,
        "y_test": y_test,
        "feature_names": feature_cols,
        "scaler": scaler,
    }


def handle_missing_values(df: pd.DataFrame) -> pd.DataFrame:
    """
    Handle missing values using appropriate strategies for each column type.

    Strategy:
      - Numeric columns: fill with MEDIAN (robust to outliers)
      - Categorical columns: fill with MODE (most common value)
      - Special columns: fill with sensible defaults
    """
    df = df.copy()

    # ── Numeric columns: fill with median ─────────────────
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    for col in numeric_cols:
        if df[col].isnull().any():
            median_val = df[col].median()
            df[col] = df[col].fillna(median_val)

    # ── Categorical columns: fill with mode ───────────────
    cat_cols = df.select_dtypes(include=["object"]).columns
    for col in cat_cols:
        if df[col].isnull().any():
            mode_val = df[col].mode()[0] if len(df[col].mode()) > 0 else "UNKNOWN"
            df[col] = df[col].fillna(mode_val)

    # ── Special: device_id gets "UNKNOWN_DEVICE" ──────────
    if "device_id" in df.columns:
        df["device_id"] = df["device_id"].fillna("UNKNOWN_DEVICE")

    # ── Special: location gets "UNKNOWN" ──────────────────
    if "location" in df.columns:
        df["location"] = df["location"].fillna("UNKNOWN")

    return df


def cap_outliers(df: pd.DataFrame, factor: float = 3.0) -> pd.DataFrame:
    """
    Cap extreme outliers using the IQR method.

    For each numeric feature column, values beyond
    Q1 - factor*IQR or Q3 + factor*IQR are clipped.

    Args:
        df: DataFrame with numeric features
        factor: IQR multiplier (default 3.0 = very conservative)
    """
    df = df.copy()
    feature_cols = get_feature_columns(df)

    for col in feature_cols:
        if col in df.columns and df[col].dtype in [np.float64, np.int64, np.float32]:
            q1 = df[col].quantile(0.25)
            q3 = df[col].quantile(0.75)
            iqr = q3 - q1
            lower = q1 - factor * iqr
            upper = q3 + factor * iqr
            df[col] = df[col].clip(lower=lower, upper=upper)

    return df


def save_scaler(scaler: StandardScaler, path: str = "app/models/scaler.pkl"):
    """Save the fitted scaler for use at prediction time."""
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(scaler, path)
    print(f"   💾 Scaler saved to {path}")


def load_scaler(path: str = "app/models/scaler.pkl") -> StandardScaler:
    """Load a previously saved scaler."""
    return joblib.load(path)
