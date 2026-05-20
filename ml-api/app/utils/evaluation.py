"""
Model Evaluation Module
========================

Generates all evaluation metrics and visualizations:
  1. Classification Report (precision, recall, F1-score)
  2. Confusion Matrix (with heatmap)
  3. ROC Curve (with AUC score)
  4. Precision-Recall Curve
  5. Feature Importance chart
  6. Fraud Probability Distribution

All plots are saved to the `outputs/` folder as PNG files.
"""

import os
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")  # Non-interactive backend (no GUI needed)
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    roc_curve,
    roc_auc_score,
    precision_recall_curve,
    average_precision_score,
    f1_score,
    accuracy_score,
)

# Output directory for all charts
OUTPUT_DIR = "outputs"


def evaluate_model(model, X_test, y_test, feature_names=None):
    """
    Run complete model evaluation and generate all visualizations.

    Args:
        model: Trained classifier (XGBoost or any sklearn-compatible model)
        X_test: Test features
        y_test: Test labels
        feature_names: List of feature column names

    Returns:
        dict with all metric values
    """
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Get predictions and probabilities
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]  # Probability of fraud (class 1)

    print("\n" + "=" * 60)
    print("📊 MODEL EVALUATION RESULTS")
    print("=" * 60)

    # ── 1. Classification Report ──────────────────────────
    metrics = _print_classification_report(y_test, y_pred, y_prob)

    # ── 2. Confusion Matrix ───────────────────────────────
    _plot_confusion_matrix(y_test, y_pred)

    # ── 3. ROC Curve ──────────────────────────────────────
    _plot_roc_curve(y_test, y_prob)

    # ── 4. Precision-Recall Curve ─────────────────────────
    _plot_precision_recall_curve(y_test, y_prob)

    # ── 5. Feature Importance ─────────────────────────────
    if feature_names is not None:
        _plot_feature_importance(model, feature_names)

    # ── 6. Fraud Probability Distribution ─────────────────
    _plot_probability_distribution(y_test, y_prob)

    print(f"\n📁 All charts saved to '{OUTPUT_DIR}/' folder")
    return metrics


# ═══════════════════════════════════════════════════════════
# 1. CLASSIFICATION REPORT
# ═══════════════════════════════════════════════════════════

def _print_classification_report(y_test, y_pred, y_prob):
    """Print detailed classification metrics."""

    report = classification_report(
        y_test, y_pred,
        target_names=["Legitimate", "Fraud"],
        output_dict=True,
    )

    # Print the text version
    print("\n📋 Classification Report:")
    print("-" * 55)
    print(classification_report(
        y_test, y_pred,
        target_names=["Legitimate", "Fraud"],
    ))

    # Key metrics
    accuracy = accuracy_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_prob)
    f1 = f1_score(y_test, y_pred)
    avg_precision = average_precision_score(y_test, y_prob)

    print(f"🎯 Key Metrics:")
    print(f"   Accuracy:           {accuracy:.4f} ({accuracy * 100:.2f}%)")
    print(f"   ROC AUC:            {auc:.4f}")
    print(f"   F1 Score (Fraud):   {f1:.4f}")
    print(f"   Avg Precision:      {avg_precision:.4f}")
    print(f"   Fraud Precision:    {report['Fraud']['precision']:.4f}")
    print(f"   Fraud Recall:       {report['Fraud']['recall']:.4f}")

    return {
        "accuracy": accuracy,
        "roc_auc": auc,
        "f1_score": f1,
        "avg_precision": avg_precision,
        "fraud_precision": report["Fraud"]["precision"],
        "fraud_recall": report["Fraud"]["recall"],
        "report": report,
    }


# ═══════════════════════════════════════════════════════════
# 2. CONFUSION MATRIX
# ═══════════════════════════════════════════════════════════

def _plot_confusion_matrix(y_test, y_pred):
    """Generate and save confusion matrix heatmap."""
    cm = confusion_matrix(y_test, y_pred)

    fig, ax = plt.subplots(figsize=(8, 6))
    sns.heatmap(
        cm, annot=True, fmt="d", cmap="Blues",
        xticklabels=["Legitimate", "Fraud"],
        yticklabels=["Legitimate", "Fraud"],
        ax=ax,
        annot_kws={"size": 16},
    )
    ax.set_xlabel("Predicted Label", fontsize=12)
    ax.set_ylabel("True Label", fontsize=12)
    ax.set_title("Confusion Matrix", fontsize=14, fontweight="bold")

    # Add descriptions in each quadrant
    total = cm.sum()
    texts = [
        f"TN: {cm[0][0]}\n({cm[0][0]/total*100:.1f}%)",
        f"FP: {cm[0][1]}\n({cm[0][1]/total*100:.1f}%)",
        f"FN: {cm[1][0]}\n({cm[1][0]/total*100:.1f}%)",
        f"TP: {cm[1][1]}\n({cm[1][1]/total*100:.1f}%)",
    ]

    plt.tight_layout()
    path = os.path.join(OUTPUT_DIR, "confusion_matrix.png")
    fig.savefig(path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"   📊 Confusion matrix saved → {path}")

    # Print text version too
    print(f"\n   Confusion Matrix:")
    print(f"                    Predicted")
    print(f"                 Legit    Fraud")
    print(f"   Actual Legit  {cm[0][0]:>6}   {cm[0][1]:>6}")
    print(f"   Actual Fraud  {cm[1][0]:>6}   {cm[1][1]:>6}")


# ═══════════════════════════════════════════════════════════
# 3. ROC CURVE
# ═══════════════════════════════════════════════════════════

def _plot_roc_curve(y_test, y_prob):
    """Generate and save ROC curve with AUC."""
    fpr, tpr, thresholds = roc_curve(y_test, y_prob)
    auc_score = roc_auc_score(y_test, y_prob)

    fig, ax = plt.subplots(figsize=(8, 6))

    # ROC curve
    ax.plot(fpr, tpr, color="#2563eb", lw=2.5, label=f"XGBoost (AUC = {auc_score:.4f})")

    # Random baseline
    ax.plot([0, 1], [0, 1], color="gray", lw=1.5, linestyle="--", label="Random (AUC = 0.5)")

    # Find best threshold
    optimal_idx = np.argmax(tpr - fpr)
    optimal_threshold = thresholds[optimal_idx]
    ax.scatter(
        fpr[optimal_idx], tpr[optimal_idx],
        color="#ef4444", s=100, zorder=5,
        label=f"Best threshold = {optimal_threshold:.3f}",
    )

    ax.set_xlabel("False Positive Rate", fontsize=12)
    ax.set_ylabel("True Positive Rate", fontsize=12)
    ax.set_title("ROC Curve — Fraud Detection", fontsize=14, fontweight="bold")
    ax.legend(loc="lower right", fontsize=10)
    ax.grid(True, alpha=0.3)

    plt.tight_layout()
    path = os.path.join(OUTPUT_DIR, "roc_curve.png")
    fig.savefig(path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"   📊 ROC curve saved → {path}")


# ═══════════════════════════════════════════════════════════
# 4. PRECISION-RECALL CURVE
# ═══════════════════════════════════════════════════════════

def _plot_precision_recall_curve(y_test, y_prob):
    """Generate and save Precision-Recall curve."""
    precision, recall, thresholds = precision_recall_curve(y_test, y_prob)
    avg_precision = average_precision_score(y_test, y_prob)

    fig, ax = plt.subplots(figsize=(8, 6))

    ax.plot(recall, precision, color="#16a34a", lw=2.5,
            label=f"XGBoost (AP = {avg_precision:.4f})")

    # Baseline (random)
    fraud_rate = y_test.mean()
    ax.axhline(y=fraud_rate, color="gray", lw=1.5, linestyle="--",
               label=f"Baseline (fraud rate = {fraud_rate:.3f})")

    ax.set_xlabel("Recall", fontsize=12)
    ax.set_ylabel("Precision", fontsize=12)
    ax.set_title("Precision-Recall Curve — Fraud Detection", fontsize=14, fontweight="bold")
    ax.legend(loc="upper right", fontsize=10)
    ax.grid(True, alpha=0.3)
    ax.set_xlim([0, 1.02])
    ax.set_ylim([0, 1.02])

    plt.tight_layout()
    path = os.path.join(OUTPUT_DIR, "precision_recall_curve.png")
    fig.savefig(path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"   📊 Precision-Recall curve saved → {path}")


# ═══════════════════════════════════════════════════════════
# 5. FEATURE IMPORTANCE
# ═══════════════════════════════════════════════════════════

def _plot_feature_importance(model, feature_names, top_n=20):
    """Generate and save feature importance chart."""

    # Get importances (works for XGBoost, RandomForest, etc.)
    if hasattr(model, "feature_importances_"):
        importances = model.feature_importances_
    else:
        print("   ⚠️  Model has no feature_importances_ attribute, skipping chart")
        return

    # Create sorted DataFrame
    importance_df = pd.DataFrame({
        "feature": feature_names,
        "importance": importances,
    }).sort_values("importance", ascending=True).tail(top_n)

    fig, ax = plt.subplots(figsize=(10, 8))
    colors = plt.cm.Blues(np.linspace(0.3, 0.9, len(importance_df)))

    ax.barh(
        importance_df["feature"],
        importance_df["importance"],
        color=colors,
        edgecolor="white",
    )
    ax.set_xlabel("Importance Score", fontsize=12)
    ax.set_title(f"Top {top_n} Feature Importances", fontsize=14, fontweight="bold")
    ax.grid(axis="x", alpha=0.3)

    plt.tight_layout()
    path = os.path.join(OUTPUT_DIR, "feature_importance.png")
    fig.savefig(path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"   📊 Feature importance saved → {path}")

    # Print top features
    print(f"\n   🔍 Top 10 Most Important Features:")
    top_features = importance_df.tail(10).iloc[::-1]
    for _, row in top_features.iterrows():
        bar = "█" * int(row["importance"] * 50)
        print(f"      {row['feature']:30s} {row['importance']:.4f} {bar}")


# ═══════════════════════════════════════════════════════════
# 6. FRAUD PROBABILITY DISTRIBUTION
# ═══════════════════════════════════════════════════════════

def _plot_probability_distribution(y_test, y_prob):
    """Show how fraud probabilities are distributed for each class."""

    fig, ax = plt.subplots(figsize=(10, 6))

    # Separate probabilities by actual class
    legit_probs = y_prob[y_test == 0]
    fraud_probs = y_prob[y_test == 1]

    ax.hist(legit_probs, bins=50, alpha=0.6, color="#22c55e", label="Legitimate", density=True)
    ax.hist(fraud_probs, bins=50, alpha=0.6, color="#ef4444", label="Fraud", density=True)

    # Threshold line
    ax.axvline(x=0.5, color="black", lw=2, linestyle="--", label="Threshold (0.5)")

    ax.set_xlabel("Fraud Probability", fontsize=12)
    ax.set_ylabel("Density", fontsize=12)
    ax.set_title("Fraud Probability Distribution by Class", fontsize=14, fontweight="bold")
    ax.legend(fontsize=11)
    ax.grid(True, alpha=0.3)

    plt.tight_layout()
    path = os.path.join(OUTPUT_DIR, "probability_distribution.png")
    fig.savefig(path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"   📊 Probability distribution saved → {path}")
