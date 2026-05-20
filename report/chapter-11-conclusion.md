# CHAPTER 11: CONCLUSION

## 11.1 Summary of Work

This project set out to design, implement, and evaluate a real-time UPI fraud detection system that combines machine learning with a full-stack web application. The work progressed through a series of incremental phases, each delivering a functional component that was integrated into the final system.

The machine learning pipeline begins with a synthetic data generator that produces 50,000 UPI transaction records with realistic statistical properties and an 8 percent fraud rate. A comprehensive feature engineering module transforms 6 raw transaction attributes into 28 derived features spanning five categories: amount characteristics, balance dynamics, temporal patterns, user behavioural history, and categorical encodings. The feature set was designed with domain-specific knowledge of UPI payment patterns, incorporating indicators such as the amount-to-balance ratio, cyclical time encodings, and rapid transaction detection that capture fraud signals specific to the UPI ecosystem.

The XGBoost gradient boosting classifier, trained with SMOTE oversampling and regularisation, achieves a fraud class recall of 94 percent and a precision of 85 percent on the held-out test set. The ROC-AUC of 0.987 confirms near-perfect discrimination between fraudulent and legitimate transactions. Feature importance analysis reveals that engineered features — particularly `amount_to_balance_ratio` and `amount_log` — contribute more predictive power than raw input attributes, validating the investment in domain-specific feature engineering.

The trained model is served through a FastAPI inference service that processes single predictions in approximately 28 milliseconds, well within the 100-millisecond latency target for real-time fraud scoring. The service includes health monitoring, batch prediction, and model hot-reload capabilities.

The Express.js backend orchestrates the complete transaction lifecycle: user authentication via JWT tokens, transaction creation with fraud scoring, balance management, and alert generation. The fraud service implements a dual-mode architecture where the ML model serves as the primary scoring mechanism, with a rule-based fallback that activates automatically when the ML service is unavailable. This design ensures uninterrupted fraud monitoring regardless of infrastructure state.

The React frontend provides a comprehensive monitoring dashboard with KPI visualisations, filterable transaction listings, alert management with severity-based organisation, a manual fraud-checking interface, and analytical views. Custom React hooks encapsulate all data fetching and state management logic, producing a clean separation between data concerns and presentation that improves maintainability and testability.

## 11.2 Objectives Achieved

Revisiting the objectives stated in Chapter 1:

**Objective 1 — Synthetic Data Generation.** Achieved. The data generator produces 50,000 realistic UPI transactions with configurable fraud patterns, transaction type distributions, and temporal characteristics.

**Objective 2 — Feature Engineering.** Achieved. A 28-feature set was designed and implemented, capturing amount, balance, temporal, behavioural, and categorical patterns. Feature importance analysis confirms the discriminative value of the engineered features.

**Objective 3 — Model Training and Evaluation.** Achieved. The XGBoost classifier achieves 94 percent fraud recall and 0.987 ROC-AUC, demonstrating effective fraud detection with manageable false positive rates. SMOTE oversampling contributes a 7.5 percentage-point improvement in recall.

**Objective 4 — ML API Deployment.** Achieved. The FastAPI service serves predictions with 28 ms average latency, supports batch processing, and includes health monitoring and model management endpoints.

**Objective 5 — Full-Stack Web Application.** Achieved. The system comprises a Node.js backend with JWT authentication and role-based access control, and a React frontend with dashboard, transaction management, alert monitoring, and fraud checking interfaces.

**Objective 6 — Dual-Mode Detection.** Achieved. The system transparently falls back to rule-based scoring when the ML service is unavailable, with automatic recovery when the service returns.

**Objective 7 — Comprehensive Evaluation.** Achieved. The model is evaluated using accuracy, precision, recall, F1-score, ROC-AUC, and average precision. System-level testing covers API endpoints, integration flows, security, and performance.

## 11.3 Contributions

This project makes the following contributions:

1. **UPI-Specific Feature Set.** Unlike prior work that applies generic credit card fraud features to UPI data, this project develops a feature set tailored to UPI transaction characteristics, including balance ratio features, cyclical time encodings, and per-sender behavioural aggregations.

2. **Dual-Mode Detection Architecture.** The combination of ML-based primary scoring with rule-based fallback has not been previously documented in the UPI fraud detection context. This architecture provides a practical template for building resilient fraud detection systems.

3. **End-to-End System.** Most academic fraud detection studies focus exclusively on the ML component. This project delivers a complete, deployable system — from data generation through model training, API serving, backend orchestration, and frontend visualisation — providing a reference implementation for the full machine learning operations lifecycle.

4. **React 18 Integration Patterns.** The custom hook architecture demonstrates clean patterns for integrating async data fetching with React 18's concurrent rendering model, including the resolution of the StrictMode double-mount issue that affects many real-world React applications.

## 11.4 Lessons Learned

Several technical lessons emerged during the development process:

**Feature engineering outweighs algorithm selection.** The difference in performance between XGBoost with and without the engineered feature set was greater than the difference between XGBoost and alternative algorithms (random forest, logistic regression) with the same features. Investing time in understanding the domain and designing relevant features yielded larger returns than hyperparameter tuning.

**Class imbalance requires multi-level treatment.** Applying SMOTE alone or `scale_pos_weight` alone each improved fraud recall, but combining both approaches produced the best overall F1-score. The combination addresses imbalance at the data level (SMOTE) and the algorithm level (cost-sensitive weighting) simultaneously.

**Graceful degradation is an architectural decision, not an afterthought.** The rule-based fallback was designed alongside the ML integration, not added later. This upfront decision influenced the fraud service's interface design, ensuring that both scoring mechanisms produce compatible output formats.

**React 18's concurrent features require careful hook design.** The StrictMode double-mount behaviour exposed a subtle bug in the `mountedRef` cleanup pattern that had been a standard practice in React 16/17 applications. The resolution — trusting React 18's internal handling of unmounted state updates — simplified the hook implementations.
