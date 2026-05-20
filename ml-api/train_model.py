"""
╔═══════════════════════════════════════════════════════════╗
║   UPI Fraud Detection — ML Training Pipeline              ║
║                                                           ║
║   Steps:                                                  ║
║   1. Generate synthetic dataset (50K transactions)        ║
║   2. Engineer 28+ features (behavioral analytics)         ║
║   3. Preprocess (missing values, outliers, scaling)       ║
║   4. SMOTE oversampling (fix class imbalance)             ║
║   5. Train XGBoost classifier                             ║
║   6. Evaluate (ROC, confusion matrix, PR curve)           ║
║   7. Save model + scaler + feature list                   ║
║                                                           ║
║   Usage:                                                  ║
║     cd ml-api                                             ║
║     python train_model.py                                 ║
║                                                           ║
║   Outputs:                                                ║
║     app/models/fraud_model.pkl      — Trained XGBoost     ║
║     app/models/scaler.pkl           — Fitted scaler       ║
║     app/models/feature_columns.pkl  — Feature list        ║
║     data/upi_transactions.csv       — Raw dataset         ║
║     data/upi_transactions_featured.csv — With features    ║
║     outputs/*.png                   — Evaluation charts   ║
╚═══════════════════════════════════════════════════════════╝
"""

import os
import sys
import time
import numpy as np
import pandas as pd
import joblib
from xgboost import XGBClassifier
from imblearn.over_sampling import SMOTE

# Add project root to path so imports work
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.utils.generate_dataset import generate_dataset
from app.utils.feature_engineering import engineer_features, get_feature_columns, TARGET_COLUMN
from app.utils.preprocessing import preprocess_dataset, save_scaler
from app.utils.evaluation import evaluate_model

# ── Configuration ─────────────────────────────────────────
NUM_SAMPLES = 50000       # Total transactions
FRAUD_RATIO = 0.08        # 8% fraud (realistic for UPI)
TEST_SIZE = 0.2           # 80/20 train/test split
RANDOM_STATE = 42         # Reproducibility
SMOTE_RATIO = 0.3         # Oversample fraud to 30% of majority class


def main():
    start_time = time.time()

    print("=" * 60)
    print("🧠 UPI FRAUD DETECTION — ML TRAINING PIPELINE")
    print("=" * 60)

    # ══════════════════════════════════════════════════════
    # STEP 1: Generate Synthetic Dataset
    # ══════════════════════════════════════════════════════
    print("\n📌 STEP 1/7: Generating synthetic dataset")
    print("-" * 40)

    os.makedirs("data", exist_ok=True)
    os.makedirs("app/models", exist_ok=True)
    os.makedirs("outputs", exist_ok=True)

    df = generate_dataset(
        n_samples=NUM_SAMPLES,
        fraud_ratio=FRAUD_RATIO,
        seed=RANDOM_STATE,
    )

    # Save raw dataset
    raw_path = "data/upi_transactions.csv"
    df.to_csv(raw_path, index=False)
    print(f"   💾 Raw dataset saved → {raw_path}")

    # ══════════════════════════════════════════════════════
    # STEP 2: Feature Engineering
    # ══════════════════════════════════════════════════════
    print("\n📌 STEP 2/7: Feature engineering")
    print("-" * 40)

    df_featured = engineer_features(df)

    # Save featured dataset for analysis
    featured_path = "data/upi_transactions_featured.csv"
    df_featured.to_csv(featured_path, index=False)
    print(f"   💾 Featured dataset saved → {featured_path}")

    # ══════════════════════════════════════════════════════
    # STEP 3: Preprocessing
    # ══════════════════════════════════════════════════════
    print("\n📌 STEP 3/7: Preprocessing (missing values, outliers, scaling)")
    print("-" * 40)

    processed = preprocess_dataset(
        df_featured,
        test_size=TEST_SIZE,
        random_state=RANDOM_STATE,
    )

    X_train = processed["X_train"]
    X_test = processed["X_test"]
    y_train = processed["y_train"]
    y_test = processed["y_test"]
    feature_names = processed["feature_names"]
    scaler = processed["scaler"]

    # ══════════════════════════════════════════════════════
    # STEP 4: SMOTE Oversampling
    # ══════════════════════════════════════════════════════
    print("\n📌 STEP 4/7: SMOTE oversampling (fixing class imbalance)")
    print("-" * 40)

    print(f"   Before SMOTE:")
    print(f"     Legitimate: {(y_train == 0).sum():,}")
    print(f"     Fraud:      {(y_train == 1).sum():,}")
    print(f"     Ratio:      1:{(y_train == 0).sum() / max((y_train == 1).sum(), 1):.1f}")

    smote = SMOTE(
        sampling_strategy=SMOTE_RATIO,  # Fraud = 30% of legitimate
        random_state=RANDOM_STATE,
        k_neighbors=5,
    )
    X_train_resampled, y_train_resampled = smote.fit_resample(X_train, y_train)

    print(f"\n   After SMOTE:")
    print(f"     Legitimate: {(y_train_resampled == 0).sum():,}")
    print(f"     Fraud:      {(y_train_resampled == 1).sum():,}")
    print(f"     Ratio:      1:{(y_train_resampled == 0).sum() / max((y_train_resampled == 1).sum(), 1):.1f}")
    print(f"     Total:      {len(y_train_resampled):,} samples")

    # ══════════════════════════════════════════════════════
    # STEP 5: Train XGBoost Model
    # ══════════════════════════════════════════════════════
    print("\n📌 STEP 5/7: Training XGBoost classifier")
    print("-" * 40)

    # Calculate scale_pos_weight for additional class balancing
    n_legit = (y_train_resampled == 0).sum()
    n_fraud = (y_train_resampled == 1).sum()
    scale_weight = n_legit / max(n_fraud, 1)

    model = XGBClassifier(
        # ── Tree parameters ────────────────────
        n_estimators=200,         # Number of trees
        max_depth=6,              # Maximum tree depth (prevents overfitting)
        learning_rate=0.1,        # Step size shrinkage
        min_child_weight=3,       # Minimum samples in a leaf

        # ── Regularization ─────────────────────
        reg_alpha=0.1,            # L1 regularization
        reg_lambda=1.0,           # L2 regularization
        gamma=0.1,                # Minimum loss reduction for split
        subsample=0.8,            # Use 80% of data per tree
        colsample_bytree=0.8,    # Use 80% of features per tree

        # ── Class imbalance ────────────────────
        scale_pos_weight=scale_weight,

        # ── Performance ────────────────────────
        n_jobs=-1,                # Use all CPU cores
        random_state=RANDOM_STATE,
        eval_metric="logloss",
        use_label_encoder=False,
    )

    print(f"   Training on {len(X_train_resampled):,} samples with {len(feature_names)} features...")
    train_start = time.time()

    model.fit(
        X_train_resampled, y_train_resampled,
        eval_set=[(X_test, y_test)],  # Monitor test performance
        verbose=False,
    )

    train_time = time.time() - train_start
    print(f"   ✅ Training completed in {train_time:.1f} seconds")

    # ══════════════════════════════════════════════════════
    # STEP 6: Evaluate Model
    # ══════════════════════════════════════════════════════
    print("\n📌 STEP 6/7: Evaluating model")
    print("-" * 40)

    metrics = evaluate_model(model, X_test, y_test, feature_names)

    # ══════════════════════════════════════════════════════
    # STEP 7: Save Everything
    # ══════════════════════════════════════════════════════
    print("\n📌 STEP 7/7: Saving model artifacts")
    print("-" * 40)

    # Save model
    model_path = "app/models/fraud_model.pkl"
    joblib.dump(model, model_path)
    print(f"   💾 Model saved → {model_path}")

    # Save scaler
    save_scaler(scaler, "app/models/scaler.pkl")

    # Save feature column list (for prediction-time consistency)
    feature_path = "app/models/feature_columns.pkl"
    joblib.dump(feature_names, feature_path)
    print(f"   💾 Feature columns saved → {feature_path}")

    # ══════════════════════════════════════════════════════
    # SUMMARY
    # ══════════════════════════════════════════════════════
    total_time = time.time() - start_time

    print("\n" + "=" * 60)
    print("✅ TRAINING PIPELINE COMPLETE")
    print("=" * 60)
    print(f"""
   📊 Dataset:       {NUM_SAMPLES:,} transactions ({FRAUD_RATIO * 100:.0f}% fraud)
   🔧 Features:      {len(feature_names)} engineered features
   ⚖️  SMOTE:         Fraud oversampled to {SMOTE_RATIO * 100:.0f}% of majority
   🏋️  Model:         XGBoost (200 trees, depth 6)
   🎯 Accuracy:      {metrics['accuracy'] * 100:.2f}%
   📈 ROC AUC:       {metrics['roc_auc']:.4f}
   🎯 F1 (Fraud):    {metrics['f1_score']:.4f}
   🔍 Precision:     {metrics['fraud_precision']:.4f}
   📡 Recall:        {metrics['fraud_recall']:.4f}
   ⏱️  Total time:    {total_time:.1f} seconds

   📁 Files created:
      app/models/fraud_model.pkl       — Trained model
      app/models/scaler.pkl            — Feature scaler
      app/models/feature_columns.pkl   — Feature list
      data/upi_transactions.csv        — Raw dataset
      data/upi_transactions_featured.csv — Featured dataset
      outputs/confusion_matrix.png     — Confusion matrix
      outputs/roc_curve.png            — ROC curve
      outputs/precision_recall_curve.png — PR curve
      outputs/feature_importance.png   — Feature rankings
      outputs/probability_distribution.png — Score distribution

   🚀 Start the API:
      uvicorn app.main:app --reload --port 8000
    """)


if __name__ == "__main__":
    main()
