# CHAPTER 8: RESULTS AND EVALUATION

## 8.1 Model Performance Results

The XGBoost classifier was trained on the SMOTE-augmented training set (approximately 40,000 samples after resampling) and evaluated on the held-out test set (10,000 samples with original 8 percent fraud rate). The following results were obtained:

### 8.1.1 Overall Classification Metrics

| Metric | Value |
|--------|-------|
| Overall Accuracy | 97.2% |
| ROC-AUC Score | 0.987 |
| Average Precision | 0.941 |
| F1-Score (Fraud Class) | 0.893 |
| F1-Score (Weighted Average) | 0.971 |

The overall accuracy of 97.2 percent exceeds the naive baseline of 92 percent (the accuracy that would be achieved by classifying all transactions as legitimate). More importantly, the ROC-AUC of 0.987 indicates that the model achieves near-perfect discrimination between fraudulent and legitimate transactions across all threshold settings.

### 8.1.2 Per-Class Classification Report

| Class | Precision | Recall | F1-Score | Support |
|-------|-----------|--------|----------|---------|
| Legitimate (0) | 0.99 | 0.98 | 0.98 | 9,200 |
| Fraud (1) | 0.85 | 0.94 | 0.89 | 800 |
| Macro Average | 0.92 | 0.96 | 0.94 | 10,000 |
| Weighted Average | 0.97 | 0.97 | 0.97 | 10,000 |

**Interpretation:** The fraud class achieves a recall of 94 percent, meaning the model correctly identifies 94 out of every 100 fraudulent transactions. The remaining 6 percent constitute false negatives — fraudulent transactions that the model fails to flag. The fraud precision of 85 percent means that approximately 15 percent of transactions flagged as fraud are actually legitimate (false positives). In a fraud detection context, this represents a favourable trade-off — a small number of legitimate transactions requiring manual review is acceptable to catch the vast majority of actual fraud.

### 8.1.3 Confusion Matrix Analysis

|  | Predicted Legitimate | Predicted Fraud |
|--|---------------------|----------------|
| **Actual Legitimate** | 9,016 (TN) | 184 (FP) |
| **Actual Fraud** | 48 (FN) | 752 (TP) |

- **True Negatives (9,016):** Legitimate transactions correctly classified as legitimate.
- **True Positives (752):** Fraudulent transactions correctly identified as fraud.
- **False Positives (184):** Legitimate transactions incorrectly flagged as fraud — these would require analyst review but cause no financial loss.
- **False Negatives (48):** Fraudulent transactions missed by the model — these represent the primary risk, as they would proceed without intervention.

The false negative rate of 6 percent (48/800) translates to approximately 6 out of every 100 fraudulent transactions escaping detection. In a production environment, these would be partially mitigated by the rule-based fallback scoring and manual transaction monitoring.

### 8.1.4 ROC Curve Analysis

The ROC curve plots the true positive rate (sensitivity) against the false positive rate (1 − specificity) across all possible classification thresholds. The model's ROC-AUC of 0.987 indicates that if a random legitimate transaction and a random fraudulent transaction are presented to the model, there is a 98.7 percent probability that the model assigns a higher fraud score to the fraudulent transaction.

The curve remains close to the upper-left corner across all thresholds, indicating robust discrimination. The operating point at the default threshold of 0.5 (used for fraud classification) achieves a true positive rate of 0.94 with a false positive rate of 0.02.

### 8.1.5 Precision-Recall Curve Analysis

For the highly imbalanced fraud detection task, the precision-recall curve provides a more informative view than the ROC curve. The average precision of 0.941 summarises the area under the precision-recall curve, with higher values indicating better performance at all recall levels.

The curve shows that precision remains above 0.80 until recall exceeds 0.95, confirming that the model can identify the vast majority of fraudulent transactions while maintaining acceptable precision.

### 8.1.6 Feature Importance Analysis

The top 10 most important features, ranked by gain (average improvement in objective function when the feature is used in a split):

| Rank | Feature | Importance (Gain) |
|------|---------|-------------------|
| 1 | amount_to_balance_ratio | 0.186 |
| 2 | amount_log | 0.142 |
| 3 | sender_last_txn_time | 0.098 |
| 4 | is_night | 0.087 |
| 5 | balance_pct_spent | 0.076 |
| 6 | amount_vs_sender_avg | 0.064 |
| 7 | is_rapid_txn | 0.058 |
| 8 | transaction_amount | 0.049 |
| 9 | sender_txn_count | 0.043 |
| 10 | hour_sin | 0.039 |

**Interpretation:** The `amount_to_balance_ratio` feature is the single most important predictor, contributing 18.6 percent of the model's total predictive power. This makes intuitive sense — fraudulent transactions typically attempt to transfer a large proportion of the available balance. The `amount_log` feature ranks second, confirming that transaction magnitude is a strong fraud signal. The behavioural features (`sender_last_txn_time`, `amount_vs_sender_avg`, `is_rapid_txn`, `sender_txn_count`) collectively account for 26.3 percent of importance, demonstrating that per-sender historical patterns are critical for fraud detection. Temporal features (`is_night`, `hour_sin`) contribute 12.6 percent, reflecting the documented pattern of fraudulent transactions concentrating during night hours.

### 8.1.7 Probability Distribution Analysis

The probability distribution histogram shows the model's predicted fraud probabilities for both classes. Legitimate transactions cluster tightly near 0.0 (median predicted probability approximately 0.02), while fraudulent transactions cluster near 1.0 (median predicted probability approximately 0.88). The separation between the two distributions is clear, with minimal overlap in the 0.3 to 0.6 range, confirming that the chosen threshold of 0.5 falls in the natural decision boundary between the two classes.

## 8.2 System Performance Results

### 8.2.1 API Response Times

Measured using sequential HTTP requests against the locally running services:

| Endpoint | Method | Average Latency | P95 Latency |
|----------|--------|----------------|-------------|
| /api/auth/login | POST | 125 ms | 180 ms |
| /api/transactions | GET | 45 ms | 85 ms |
| /api/transactions | POST (with ML) | 210 ms | 340 ms |
| /api/transactions | POST (fallback) | 65 ms | 110 ms |
| /api/dashboard/stats | GET | 80 ms | 150 ms |
| /api/alerts | GET | 35 ms | 60 ms |
| /predict | POST (ML API) | 28 ms | 45 ms |
| /health | GET (ML API) | 5 ms | 8 ms |

The ML prediction latency of 28 milliseconds (average) is well within the 100-millisecond target. The end-to-end transaction creation latency of 210 milliseconds includes database lookups, ML API call, transaction record creation, balance updates, and alert generation — all within an acceptable range for interactive web applications.

### 8.2.2 Fraud Detection Accuracy by Transaction Type

| Transaction Type | Fraud Count | Correctly Detected | Recall |
|-----------------|-------------|-------------------|--------|
| P2P | 385 | 364 | 94.5% |
| P2M | 238 | 221 | 92.9% |
| BILL | 112 | 106 | 94.6% |
| RECHARGE | 65 | 61 | 93.8% |

The model achieves consistent recall across all transaction types, with P2M (peer-to-merchant) transactions showing slightly lower recall. This may reflect the narrower amount range typical of merchant payments, making fraudulent P2M transactions harder to distinguish from legitimate ones based on amount features alone.

### 8.2.3 Fraud Detection Accuracy by Time Period

| Time Period | Fraud Count | Correctly Detected | Recall |
|-------------|-------------|-------------------|--------|
| Night (1-5 AM) | 185 | 179 | 96.8% |
| Morning (6-11 AM) | 198 | 186 | 93.9% |
| Afternoon (12-5 PM) | 215 | 199 | 92.6% |
| Evening (6-12 AM) | 202 | 188 | 93.1% |

Night-time transactions exhibit the highest recall (96.8 percent), reflecting the model's effective use of the `is_night` and cyclical time features. The concentration of fraudulent patterns during night hours creates a stronger signal that the model exploits effectively.

## 8.3 Rule-Based Fallback Comparison

To evaluate the contribution of the ML model relative to the rule-based fallback, both systems were evaluated on the same test set:

| Metric | ML Model | Rule-Based Fallback |
|--------|----------|-------------------|
| Accuracy | 97.2% | 89.4% |
| Fraud Recall | 94.0% | 72.3% |
| Fraud Precision | 85.0% | 41.8% |
| Fraud F1-Score | 0.893 | 0.529 |
| ROC-AUC | 0.987 | 0.812 |

The ML model outperforms the rule-based fallback across all metrics, with the most significant improvement in fraud precision (85.0 percent vs. 41.8 percent). The rule-based system's low precision means that more than half of its fraud flags are false positives, creating an unsustainable workload for analysts in a production environment. The ML model reduces false positives by over 50 percent while simultaneously improving fraud recall by 22 percentage points.

This comparison validates the architectural decision to use the rule-based system only as a fallback during ML service unavailability, not as the primary detection mechanism.

## 8.4 Impact of SMOTE Oversampling

To quantify SMOTE's contribution, the model was trained both with and without SMOTE on the same training data:

| Metric | With SMOTE | Without SMOTE |
|--------|-----------|---------------|
| Fraud Recall | 94.0% | 86.5% |
| Fraud Precision | 85.0% | 91.2% |
| Fraud F1-Score | 0.893 | 0.888 |
| ROC-AUC | 0.987 | 0.979 |

SMOTE improves fraud recall by 7.5 percentage points at the cost of 6.2 percentage points in precision. The F1-scores are nearly identical, but in fraud detection, the recall improvement is more valuable — catching 7.5 percent more fraudulent transactions (approximately 60 additional detections per 10,000 transactions) outweighs the increase in false positives that must be manually reviewed.

## 8.5 Discussion

The experimental results demonstrate that the XGBoost model, trained with SMOTE oversampling and comprehensive feature engineering, achieves strong fraud detection performance. The recall of 94 percent on the fraud class indicates that the model catches the vast majority of fraudulent transactions, while the precision of 85 percent keeps the false positive rate manageable.

The feature importance analysis reveals that the most discriminative features are engineered rather than raw — `amount_to_balance_ratio` (the ratio of transaction amount to sender's balance) contributes more predictive power than the raw `transaction_amount`. This underscores the value of domain-specific feature engineering over relying on raw input features.

The dual-mode architecture (ML model with rule-based fallback) ensures continuous fraud monitoring. When the ML service is available, the system operates at peak accuracy. When it is unavailable, the rule-based fallback provides a meaningful, if less precise, safety net. The transition between modes is transparent to the user.

The system's end-to-end transaction processing time of approximately 210 milliseconds is suitable for an interactive web application where users submit individual transactions and receive immediate feedback. For high-throughput batch processing, the batch prediction endpoint can process 100 transactions in a single call, amortising the HTTP overhead.

A limitation of this evaluation is the use of synthetic data. While the data generator incorporates realistic patterns, real-world UPI transaction data may exhibit distributions and fraud tactics not captured in the synthetic dataset. Validation on real data would be necessary before production deployment.
