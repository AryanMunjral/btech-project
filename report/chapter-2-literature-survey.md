# CHAPTER 2: LITERATURE SURVEY

## 2.1 Overview

Fraud detection in electronic payment systems has been a subject of active research since the widespread adoption of credit cards in the 1990s. The field has progressed through three distinct phases: rule-based expert systems, statistical anomaly detection methods, and contemporary machine-learning-driven approaches. This chapter reviews the foundational and recent work in each of these areas, with particular attention to techniques applicable to UPI transaction fraud.

## 2.2 Rule-Based Fraud Detection Systems

Early fraud detection systems operated entirely on hand-crafted rules derived from domain expertise. Bolton and Hand (2002) provided one of the first comprehensive surveys of statistical fraud detection methods, categorising approaches into supervised methods (requiring labelled fraud data) and unsupervised methods (identifying anomalies without labels). They noted that rule-based systems, while transparent and easy to audit, suffer from rigidity — a characteristic that makes them progressively less effective as fraud tactics evolve.

Kou et al. (2004) surveyed fraud detection in credit card transactions and identified that static threshold rules generate false positive rates exceeding 90 percent in some deployments, meaning that for every genuine fraud caught, nine or more legitimate transactions were incorrectly flagged. This finding underscored the need for adaptive detection mechanisms.

Phua et al. (2010) categorised fraud detection techniques along four dimensions: the type of fraud, the detection methodology, the computational approach, and the evaluation metric. They observed that most deployed systems used a combination of rule-based filters (for obvious violations) and statistical models (for subtle patterns), a hybrid approach that this project also adopts.

## 2.3 Machine Learning for Financial Fraud Detection

The application of machine learning to fraud detection gained momentum with the availability of computational resources capable of processing large transaction volumes and the development of algorithms suited to the characteristics of fraud data — namely, extreme class imbalance, concept drift, and non-stationary distributions.

### 2.3.1 Logistic Regression and Decision Trees

Bhattacharyya et al. (2011) compared logistic regression, support vector machines, and random forests on credit card fraud data. Their study found that random forests consistently outperformed logistic regression in terms of AUC (Area Under the Receiver Operating Characteristic Curve), with random forest achieving AUC values above 0.95 on held-out test sets. Logistic regression, despite its simplicity, served as a useful baseline due to its interpretability and computational efficiency.

Sahin et al. (2013) applied decision tree algorithms (C4.5 and CART) to credit card fraud detection and reported that while decision trees provided human-readable rule sets, they were prone to overfitting on imbalanced datasets unless combined with ensemble techniques or resampling strategies.

### 2.3.2 Ensemble Methods and Gradient Boosting

Ensemble methods aggregate predictions from multiple base learners to improve generalisation. Random forests, introduced by Breiman (2001), build multiple decision trees on bootstrapped samples and average their predictions. Gradient boosting, formalised by Friedman (2001), takes a different approach by sequentially building trees where each new tree corrects the errors of its predecessors.

Chen and Guestrin (2016) introduced XGBoost (Extreme Gradient Boosting), an optimised implementation of gradient boosting that incorporates regularisation (L1 and L2 penalties on leaf weights), column subsampling, and efficient handling of sparse data. XGBoost achieved state-of-the-art results in numerous Kaggle competitions and has since been widely adopted in industry for tabular data tasks, including fraud detection.

Ke et al. (2017) subsequently developed LightGBM, a gradient boosting framework that uses histogram-based splitting and gradient-based one-side sampling to achieve faster training on large datasets. While LightGBM offers speed advantages, XGBoost's mature regularisation framework and extensive tuning documentation make it the preferred choice for many production fraud detection systems.

Xuan et al. (2018) applied random forest and gradient boosting ensemble methods specifically to financial transaction fraud, reporting that gradient boosting models achieved recall rates of 80 to 85 percent on fraud classes while maintaining overall accuracy above 97 percent.

### 2.3.3 Deep Learning Approaches

Recent work has explored deep learning architectures for fraud detection. Roy et al. (2018) applied deep autoencoders to learn compressed representations of normal transaction behaviour, flagging transactions whose reconstruction error exceeded a learned threshold. Zhang et al. (2019) used Long Short-Term Memory (LSTM) networks to model sequential transaction behaviour, capturing temporal dependencies that tree-based methods might miss.

However, Hancock and Khoshgoftaar (2020) conducted a meta-analysis of fraud detection studies and found that for structured, tabular financial data, gradient boosting methods (XGBoost, LightGBM) consistently matched or outperformed deep learning models while requiring significantly less training data, computational resources, and hyperparameter tuning. This finding informed the model selection decision in this project.

## 2.4 Handling Class Imbalance

Class imbalance is a defining characteristic of fraud detection datasets. In typical payment systems, fraudulent transactions constitute between 0.1 and 2 percent of total volume, creating severe skew that biases classifiers toward the majority class.

### 2.4.1 Resampling Techniques

Chawla et al. (2002) introduced SMOTE (Synthetic Minority Over-sampling Technique), which generates synthetic samples for the minority class by interpolating between existing minority samples and their nearest neighbours. SMOTE addresses class imbalance at the data level, producing a more balanced training set without simply duplicating existing fraud examples.

Haibo He and Garcia (2009) provided a comprehensive review of learning from imbalanced data, comparing oversampling (SMOTE, ADASYN), undersampling (random undersampling, Tomek links, NearMiss), and hybrid approaches. They concluded that the optimal strategy depends on the dataset characteristics, but SMOTE with appropriate sampling ratios consistently delivered robust improvements across domains.

Fernandez et al. (2018) studied the interaction between SMOTE and ensemble classifiers, finding that SMOTE combined with tree-based ensembles (random forest, gradient boosting) produced the best results for binary classification on imbalanced data. They recommended a sampling ratio that brings the minority class to between 20 and 40 percent of the majority class rather than full balance, as over-sampling can introduce noise.

### 2.4.2 Cost-Sensitive Learning

An alternative to resampling is cost-sensitive learning, where the misclassification cost for minority-class samples is set higher than for majority-class samples. XGBoost implements this through the `scale_pos_weight` parameter, which adjusts the gradient calculation to penalise false negatives more heavily. Chen and Guestrin (2016) demonstrated that this approach is mathematically equivalent to oversampling the positive class by the specified weight factor, but without the memory overhead of duplicating samples.

This project employs both SMOTE (at the data level) and `scale_pos_weight` (at the algorithm level) to address class imbalance comprehensively.

## 2.5 Feature Engineering for Payment Fraud

Feature engineering — the process of transforming raw transaction attributes into discriminative variables — is widely recognised as the most impactful step in building fraud detection models.

Whitrow et al. (2009) introduced the concept of transaction aggregation features, computing statistics such as average transaction amount, transaction frequency, and unique merchant count over sliding time windows for each cardholder. These aggregated features capture behavioural patterns that individual transaction features cannot.

Bahnsen et al. (2016) extended this work by engineering features based on the periodic behaviour of cardholders — encoding the time of transaction using cyclical transformations (sine and cosine of the hour and day) to capture the circular nature of time. This approach prevents the model from treating 23:00 and 00:00 as maximally distant, a pitfall of linear time encoding.

Jurgovsky et al. (2018) proposed sequence-based features using LSTM networks to encode the history of transactions for each user. While effective, this approach requires maintaining per-user state across transactions, adding complexity to the serving infrastructure.

This project draws on these established feature engineering practices, adapting them for UPI-specific transaction attributes. The feature set includes amount transformations (log scaling, threshold indicators), balance ratio features (capturing sender's financial capacity), cyclical time encodings (capturing hour-of-day and day-of-week periodicities), and behavioural aggregation features (sender transaction count, average amount, time between transactions).

## 2.6 UPI-Specific Security Research

Research specifically addressing UPI fraud is comparatively limited, reflecting the platform's relative youth. Notable contributions include:

Kumar and Gupta (2020) analysed the security architecture of UPI and identified vulnerability classes including phishing-based collect request fraud, SIM swap attacks, and malicious overlay attacks on UPI applications. They proposed a multi-factor authentication framework but did not address transaction-level fraud scoring.

Sharma et al. (2021) proposed a machine learning model for UPI fraud detection using logistic regression and decision trees, training on a small synthetic dataset of 5,000 transactions. Their study achieved an accuracy of 92 percent but did not evaluate recall on the fraud class, making it difficult to assess the model's practical effectiveness.

Rathi and Bhatt (2022) applied random forest and neural network classifiers to a UPI fraud dataset and reported F1 scores of 0.89 for the fraud class. However, their feature set was limited to raw transaction attributes (amount, time, transaction type) without behavioural or aggregation features.

Singh and Kumar (2023) developed an anomaly detection system for UPI using isolation forests, achieving a fraud detection rate of 78 percent. While isolation forests offer the advantage of not requiring labelled data, their recall was significantly lower than supervised methods applied to the same data.

## 2.7 Web Application Frameworks for ML Deployment

The deployment of machine learning models as web services has become standardised through frameworks that expose model inference as REST API endpoints.

FastAPI, developed by Tiangolo (2018), is an asynchronous Python web framework built on Starlette and Pydantic. It supports automatic OpenAPI documentation, type-validated request parsing, and asynchronous request handling. Its performance benchmarks show throughput comparable to Node.js and Go web servers, making it suitable for low-latency inference serving.

On the backend orchestration side, Express.js remains the most widely adopted Node.js web framework, providing middleware-based request processing that enables clean separation of concerns between authentication, validation, business logic, and response handling. Prisma ORM provides type-safe database access for PostgreSQL, mapping database tables to JavaScript objects without raw SQL.

React, developed by Meta (formerly Facebook), provides a component-based architecture for building interactive user interfaces. When combined with Vite (a next-generation build tool offering near-instant hot module replacement), Tailwind CSS (a utility-first CSS framework), and Recharts (a React-native charting library), it forms a productive stack for building data-heavy dashboard applications.

## 2.8 Summary of Literature Gaps

The literature review reveals several gaps that this project addresses:

1. Most fraud detection studies focus on credit card transactions; UPI-specific research with comprehensive feature engineering is sparse.

2. Studies that do address UPI fraud typically use small datasets and limited feature sets, producing models that may not generalise to realistic transaction volumes.

3. Few studies present complete, deployable systems — most focus exclusively on the machine learning component without addressing the surrounding application infrastructure needed for practical use.

4. The integration of a machine learning model with a rule-based fallback mechanism, enabling graceful degradation when the ML service is unavailable, has not been explored in the UPI fraud detection context.

5. The interaction between React 18's concurrent rendering model and real-time fraud monitoring dashboards presents engineering challenges (such as the StrictMode double-mount issue encountered in this project) that are not discussed in existing literature.

This project contributes to the field by addressing each of these gaps through a purpose-built, end-to-end UPI fraud detection system with comprehensive feature engineering, a robust ML model, and a production-quality web application.
