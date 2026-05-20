# CHAPTER 6: MACHINE LEARNING WORKFLOW

## 6.1 Overview

The machine learning component of this system follows a structured workflow comprising five stages: data generation, feature engineering, data preprocessing, model training, and evaluation. Each stage produces persistent artefacts (CSV files, pickle files, PNG plots) that enable reproducibility and independent verification of results.

## 6.2 Synthetic Data Generation

### 6.2.1 Rationale for Synthetic Data

Real UPI transaction data is subject to stringent data protection regulations under the Reserve Bank of India's guidelines on storage of payment system data and the Information Technology Act, 2000. Obtaining such data requires formal agreements with banking institutions and regulatory approvals. For an academic project, synthetic data generation offers several advantages: full control over fraud patterns enables systematic evaluation, the absence of personally identifiable information eliminates privacy concerns, and the configurable fraud rate allows experimentation with different class imbalance scenarios.

### 6.2.2 Generation Parameters

The data generator produces 50,000 transaction records with the following statistical properties:

**Transaction Amount Distribution:** Amounts follow a log-normal distribution to reflect the empirical observation that most UPI transactions are small (below ₹1,000) while a long tail extends to large values (above ₹50,000). The parameters of the log-normal distribution were calibrated to produce a median transaction amount of approximately ₹800 with a 95th percentile around ₹15,000.

**Fraud Rate:** Set at 8 percent (4,000 fraudulent transactions out of 50,000). This rate is deliberately higher than production UPI fraud rates (typically 0.1 to 1 percent) to provide sufficient positive samples for effective model training. The model's performance on lower fraud rates can be extrapolated from its precision-recall characteristics.

**Transaction Types:** Distributed as P2P (45 percent), P2M (30 percent), BILL (15 percent), and RECHARGE (10 percent), reflecting the relative volume of each transaction type in the UPI ecosystem.

**Temporal Distribution:** Transactions are distributed across 24 hours with peaks during 10:00-12:00 and 18:00-20:00, mimicking realistic payment patterns. Weekdays have higher transaction volumes than weekends.

**Fraud Patterns:** Fraudulent transactions exhibit the following engineered characteristics:
- Higher average amounts (mean ₹8,500 vs. ₹2,100 for legitimate).
- Concentration during night hours (1:00-5:00 AM), when account holders are less likely to notice unauthorised activity.
- Higher incidence of amount-to-balance ratios exceeding 0.9, indicating attempts to drain accounts.
- Clusters of rapid successive transactions from the same sender.

### 6.2.3 Output Format

The generator produces a CSV file (`upi_transactions.csv`) with the following columns:

| Column | Type | Description |
|--------|------|-------------|
| transaction_amount | Float | Amount in INR |
| sender_balance_before | Float | Sender's balance before deduction |
| receiver_balance_before | Float | Receiver's balance before credit |
| transaction_type | String | P2P, P2M, BILL, or RECHARGE |
| timestamp | DateTime | Transaction date and time |
| location | String | City of transaction origin |
| is_fraud | Integer | Target label (0 or 1) |
| sender_id | String | Sender identifier |
| device_id | String | Device identifier |

## 6.3 Feature Engineering

Feature engineering is the most impactful component of the machine learning pipeline. The raw transaction attributes are transformed into 28 derived features that capture patterns indicative of fraudulent behaviour across five categories.

### 6.3.1 Amount Features (5 features)

**transaction_amount:** The raw transaction amount, retained as a baseline feature. The model can learn that extremely high or extremely low amounts correlate with different fraud patterns.

**amount_log:** The natural logarithm of (1 + transaction_amount). Log transformation compresses the wide range of transaction amounts (₹1 to ₹100,000+) into a narrower scale, reducing the influence of extreme outliers and enabling the model to learn proportional relationships.

**is_high_amount:** A binary indicator set to 1 when the transaction amount exceeds ₹10,000. This threshold was chosen because it represents the 90th percentile of legitimate transaction amounts in the generated dataset.

**is_very_high_amount:** A binary indicator set to 1 when the amount exceeds ₹50,000. Transactions above this amount trigger additional scrutiny in production UPI systems.

**amount_is_round:** A binary indicator set to 1 when the amount is divisible by ₹500 or ₹1,000. Fraudulent transactions often involve round amounts because perpetrators prioritise speed over precision when draining accounts.

### 6.3.2 Balance Features (5 features)

**amount_to_balance_ratio:** The ratio of the transaction amount to the sender's pre-transaction balance. This is one of the most discriminative features, as fraudulent transactions frequently attempt to transfer a large fraction of the available balance. If the sender balance is zero, the ratio is clamped at 10.0 to prevent division-by-zero errors while still signalling an anomalous condition.

**balance_after_negative:** A binary indicator set to 1 when the transaction amount exceeds the sender's balance (the transaction would result in a negative balance). Legitimate payment systems reject such transactions, but the attempt itself is a fraud signal.

**balance_pct_spent:** The percentage of the sender's balance consumed by the transaction, capped at 200 percent. This feature provides a normalised measure of transaction magnitude relative to the sender's financial capacity.

**receiver_balance_log:** The natural logarithm of (1 + receiver_balance_before). Receivers with extremely low or extremely high balances exhibit different fraud risk profiles — mule accounts (used to receive and redirect stolen funds) often have low balances.

**balance_diff:** The arithmetic difference between sender and receiver balances. Large positive differences (sender has much more than receiver) may indicate legitimate peer-to-peer transfers, while large negative differences may indicate reverse patterns associated with certain fraud schemes.

### 6.3.3 Temporal Features (9 features)

**hour:** The hour of the day (0-23) extracted from the transaction timestamp.

**day_of_week:** The day of the week (0 = Monday, 6 = Sunday).

**is_night:** A binary indicator set to 1 for transactions occurring between 1:00 AM and 5:00 AM. Analysis of fraud patterns reveals that a disproportionate fraction of fraudulent transactions occur during these hours.

**is_weekend:** A binary indicator set to 1 for Saturday and Sunday transactions.

**is_early_morning:** A binary indicator set to 1 for transactions before 7:00 AM.

**hour_sin and hour_cos:** Cyclical encodings of the hour using trigonometric functions:
- hour_sin = sin(2π × hour / 24)
- hour_cos = cos(2π × hour / 24)

These encodings capture the circular nature of time — without them, the model would treat 23:00 and 00:00 as 23 units apart rather than 1 unit apart. The sine-cosine pair preserves the cyclical relationship while providing two linearly separable features.

**dow_sin and dow_cos:** Cyclical encodings of the day of the week using the same trigonometric approach:
- dow_sin = sin(2π × day_of_week / 7)
- dow_cos = cos(2π × day_of_week / 7)

### 6.3.4 Behavioural Features (8 features)

Behavioural features capture per-sender patterns that evolve over the transaction history. These features are computed using expanding (cumulative) windows, meaning each transaction's features reflect all prior transactions by the same sender.

**sender_txn_count:** The cumulative count of transactions sent by this sender up to and including the current transaction. New senders with low counts may represent newly created mule accounts.

**sender_avg_amount:** The running average of all transaction amounts by this sender. This establishes a behavioural baseline for each sender.

**amount_vs_sender_avg:** The ratio of the current transaction amount to the sender's historical average. A sudden spike — for example, a sender whose average transaction is ₹500 attempting a ₹50,000 transfer — produces a high ratio that signals potential account compromise.

**sender_last_txn_time:** The number of minutes since the sender's previous transaction. The value is set to 999,999 for a sender's first transaction. Very short intervals between transactions (a few minutes or less) may indicate automated fraud or rapid account draining.

**is_rapid_txn:** A binary indicator set to 1 when the time since the sender's last transaction is less than 5 minutes. Rapid successive transactions from the same sender are a strong fraud signal.

**sender_unique_devices:** The cumulative count of unique device identifiers associated with this sender. A sender using many different devices may indicate account sharing or credential theft.

**sender_unique_receivers:** The cumulative count of unique receiver UPI addresses for this sender. A sudden increase may indicate mass fund transfers to mule accounts.

**sender_unique_locations:** The cumulative count of unique transaction locations for this sender. Transactions originating from many different locations in a short period suggest account compromise.

### 6.3.5 Categorical Features (2 features)

**transaction_type_encoded:** The transaction type mapped to an integer: P2P → 0, P2M → 1, BILL → 2, RECHARGE → 3. This ordinal encoding is appropriate because XGBoost handles integer-encoded categories natively through its tree-splitting mechanism.

**location_encoded:** The transaction location encoded by frequency rank, where 0 represents the most common location. Infrequent locations receive higher encoding values, and the model can learn that transactions from rare locations warrant additional scrutiny.

## 6.4 Data Preprocessing

### 6.4.1 Missing Value Imputation

Numeric features with missing values are imputed using the median of the respective column, a robust strategy that is unaffected by outliers. Categorical features (transaction type, location) are imputed using the mode (most frequent value).

### 6.4.2 Outlier Treatment

Outliers in numeric features are capped using the Interquartile Range (IQR) method with a factor of 3.0:
- Lower bound: Q1 − 3.0 × IQR
- Upper bound: Q3 + 3.0 × IQR

Values below the lower bound are set to the lower bound; values above the upper bound are set to the upper bound. The factor of 3.0 (wider than the typical 1.5) was chosen to preserve extreme but legitimate values while removing only the most egregious outliers.

### 6.4.3 Feature Scaling

All numeric features are standardised using scikit-learn's StandardScaler, which transforms each feature to have zero mean and unit variance:

x_scaled = (x − μ) / σ

where μ is the feature mean and σ is the standard deviation, both computed on the training set only to prevent information leakage from the test set.

The fitted scaler is serialised to `scaler.pkl` for use during inference, ensuring that new transactions undergo the same transformation as the training data.

### 6.4.4 Class Rebalancing with SMOTE

The training set exhibits an 8 percent fraud rate (approximately 3,200 fraud samples in 40,000 training records). SMOTE is applied to generate synthetic fraud samples, bringing the minority class to 30 percent of the majority class count. This ratio was selected based on the findings of Fernandez et al. (2018), who demonstrated that moderate oversampling (20-40 percent of majority) outperforms full balance for tree-based classifiers.

SMOTE operates by selecting a minority-class sample, identifying its k nearest minority-class neighbours (k = 5 in this implementation), and creating a synthetic sample at a random point along the line segment connecting the original sample to one of its neighbours. This produces synthetic samples that are plausible interpolations of existing fraud patterns rather than exact duplicates.

Critically, SMOTE is applied only to the training set after the train-test split. The test set retains the original class distribution to provide an unbiased evaluation of model performance.

## 6.5 Model Training

### 6.5.1 XGBoost Configuration

The XGBoost classifier is configured with the following hyperparameters:

| Parameter | Value | Purpose |
|-----------|-------|---------|
| n_estimators | 200 | Number of boosting rounds (trees) |
| max_depth | 6 | Maximum tree depth (controls complexity) |
| learning_rate | 0.1 | Step size for gradient descent |
| min_child_weight | 3 | Minimum samples in a leaf node |
| reg_alpha | 0.1 | L1 regularisation on leaf weights |
| reg_lambda | 1.0 | L2 regularisation on leaf weights |
| gamma | 0.1 | Minimum loss reduction for a split |
| subsample | 0.8 | Fraction of training data per tree |
| colsample_bytree | 0.8 | Fraction of features per tree |
| scale_pos_weight | Dynamic | Ratio of negative to positive samples |
| eval_metric | logloss | Binary cross-entropy loss |
| random_state | 42 | Reproducibility seed |

**Hyperparameter Rationale:**

- **200 trees with learning_rate 0.1** represents a moderate ensemble size. More trees with a lower learning rate would provide finer gradient approximation but increase training and inference time. The chosen combination balances accuracy with latency.

- **max_depth of 6** limits individual tree complexity. Deeper trees capture more complex feature interactions but risk overfitting the training data. A depth of 6 allows up to 64 leaf nodes per tree, sufficient for capturing multi-feature fraud patterns without memorising noise.

- **L1 and L2 regularisation** (reg_alpha = 0.1, reg_lambda = 1.0) penalise large leaf weights, preventing any single tree from making extreme predictions. L2 regularisation (the larger of the two) smooths predictions, while L1 regularisation encourages sparsity in leaf weights.

- **gamma of 0.1** requires that each tree split reduce the loss by at least 0.1 before the split is accepted. This acts as a pruning mechanism, preventing splits that provide negligible improvement.

- **subsample and colsample_bytree at 0.8** introduce randomisation by using 80 percent of the data and 80 percent of the features for each tree. This reduces correlation between trees in the ensemble, improving generalisation.

- **scale_pos_weight** is computed dynamically as the ratio of negative to positive samples in the training set (after SMOTE). This adjusts the gradient calculation to give higher importance to correct classification of fraud samples.

### 6.5.2 Training Process

The training process proceeds as follows:

1. Load the feature-engineered dataset from `upi_transactions_featured.csv`.
2. Separate features (X) from the target variable (y = is_fraud).
3. Split into training (80 percent) and test (20 percent) sets using stratified sampling to maintain the fraud class proportion in both sets.
4. Apply SMOTE to the training set, oversampling the fraud class to 30 percent of the legitimate class count.
5. Fit the StandardScaler on the SMOTE-augmented training features and transform both training and test features.
6. Compute scale_pos_weight from the post-SMOTE training set class distribution.
7. Initialise the XGBoost classifier with the hyperparameters specified above.
8. Fit the model on the scaled, SMOTE-augmented training data.
9. Serialise the trained model (`fraud_model.pkl`), scaler (`scaler.pkl`), and feature column list (`feature_columns.pkl`) using joblib.

### 6.5.3 Train-Test Split Strategy

The dataset is split using scikit-learn's `train_test_split` with `stratify=y` to ensure that both the training and test sets contain the same proportion of fraudulent transactions (8 percent). The `random_state=42` parameter ensures reproducibility across runs. The 80/20 split allocates approximately 40,000 samples for training and 10,000 for evaluation.

## 6.6 Model Evaluation

### 6.6.1 Evaluation Metrics

The trained model is evaluated on the held-out test set using the following metrics:

**Confusion Matrix:** A 2×2 matrix showing true positives (fraud correctly identified), true negatives (legitimate correctly identified), false positives (legitimate incorrectly flagged), and false negatives (fraud missed). The confusion matrix provides the foundation for computing precision, recall, and F1-score.

**Classification Report:** Precision, recall, and F1-score for both classes (legitimate and fraud), along with macro and weighted averages.

**ROC Curve and AUC:** The Receiver Operating Characteristic curve plots the true positive rate against the false positive rate across all classification thresholds. The Area Under this Curve (AUC) summarises the model's discriminative ability as a single number between 0.5 (random) and 1.0 (perfect).

**Precision-Recall Curve and Average Precision:** For imbalanced datasets, the precision-recall curve provides more informative assessment than the ROC curve. Average Precision computes the area under the precision-recall curve, giving more weight to correct classifications at higher recall levels.

**Feature Importance:** XGBoost provides feature importance scores based on the number of times each feature is used in tree splits (frequency importance) and the average gain in objective function from splits using each feature (gain importance). The top 20 features by importance are plotted to identify which transaction characteristics contribute most to fraud detection.

### 6.6.2 Evaluation Artefacts

The evaluation pipeline generates the following visual artefacts, saved as PNG files in the `outputs/` directory:

1. **confusion_matrix.png** — Annotated heatmap of the confusion matrix.
2. **roc_curve.png** — ROC curve with AUC score annotated.
3. **precision_recall_curve.png** — Precision-recall curve with average precision annotated.
4. **feature_importance.png** — Horizontal bar chart of the top 20 features by gain importance.
5. **probability_distribution.png** — Histogram showing the distribution of predicted fraud probabilities for legitimate and fraudulent transactions, visualising the separation between classes.

## 6.7 Fraud Threshold Configuration

The model outputs a continuous probability score between 0 and 1 for each transaction. This probability is mapped to discrete action categories using configurable thresholds:

| Probability Range | Classification | Action |
|-------------------|---------------|--------|
| ≥ 0.85 | BLOCKED | Transaction auto-blocked, CRITICAL alert |
| ≥ 0.50 | FLAGGED (Fraud) | Transaction flagged, HIGH severity alert |
| ≥ 0.30 | Suspicious | Transaction completed, MEDIUM alert |
| < 0.30 | Legitimate | Transaction completed, no alert |

The threshold at 0.50 for fraud classification balances precision and recall — a lower threshold would catch more fraud but generate more false positives, while a higher threshold would miss more fraud but reduce false alarms. The 0.85 blocking threshold is intentionally conservative, auto-blocking only transactions where the model expresses very high confidence in fraud, to minimise the disruption of legitimate high-value transactions.

## 6.8 Rule-Based Fallback Scoring

When the ML service is unavailable, the system computes a fraud probability using hand-crafted rules:

| Condition | Score Contribution |
|-----------|-------------------|
| Amount > ₹50,000 | +0.30 |
| Amount > ₹10,000 | +0.12 |
| Amount exceeds sender balance | +0.25 |
| Balance spending ratio > 90% | +0.20 |
| Balance spending ratio > 50% | +0.08 |
| Transaction between 1:00-5:00 AM | +0.10 |
| Round amount (divisible by ₹500/₹1,000) | +0.03 |

The individual scores are summed and clamped to the range [0, 1]. This additive scoring model is deliberately simple — its purpose is not to match ML accuracy but to provide reasonable risk assessment during ML service outages. The same threshold logic (0.85 for blocking, 0.50 for fraud, 0.30 for suspicious) is applied to the rule-based score.
