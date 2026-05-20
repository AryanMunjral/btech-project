# CHAPTER 3: METHODOLOGY

## 3.1 Development Approach

This project follows an incremental development methodology, structured into discrete phases where each phase delivers a functional subsystem that builds upon the previous ones. This approach was chosen over traditional waterfall or pure agile methodologies for the following reasons:

- The project involves three distinct technology domains (machine learning, backend development, and frontend development) that can be developed and validated independently before integration.
- Each phase produces a testable artefact, enabling early detection of design issues.
- The incremental approach allows for requirement refinement as insights emerge from intermediate results — for example, the feature engineering phase informed the API design, which in turn guided the frontend data visualization choices.

The development proceeded through the following phases:

**Phase 1-2: Project Setup and Data Generation.** Established the project repository structure, configured development tools, and implemented a synthetic data generator that produces realistic UPI transaction records with controlled fraud patterns.

**Phase 3-4: Feature Engineering and Model Training.** Designed and implemented the feature engineering pipeline that transforms raw transaction attributes into 28 derived features. Trained the XGBoost classifier with SMOTE rebalancing and evaluated its performance.

**Phase 5-6: ML API Service.** Wrapped the trained model in a FastAPI service exposing REST endpoints for single and batch prediction, health monitoring, and model management.

**Phase 7-8: Backend API and Frontend Application.** Built the Express.js backend with JWT authentication, role-based access control, and transaction processing logic. Developed the React dashboard with multiple pages for monitoring, analysis, and alert management.

**Phase 9: Integration.** Connected the frontend to the backend through custom React hooks, centralised error handling, and a comprehensive API service layer.

**Phase 10: Testing and Validation.** Conducted end-to-end testing of the complete system, validating the integration between all components.

## 3.2 Tools and Technologies

The technology stack was selected based on performance characteristics, ecosystem maturity, and suitability for each component's requirements.

### 3.2.1 Machine Learning and Data Processing

| Technology | Version | Purpose |
|-----------|---------|---------|
| Python | 3.11+ | Primary language for ML pipeline |
| XGBoost | 2.1.0 | Gradient boosting classifier |
| scikit-learn | 1.5.1 | Preprocessing, evaluation, metrics |
| imbalanced-learn | 0.12.3 | SMOTE oversampling implementation |
| pandas | 2.2.2 | Tabular data manipulation |
| NumPy | 2.0.1 | Numerical array operations |
| FastAPI | 0.112.0 | ML model serving framework |
| Uvicorn | 0.30.5 | ASGI web server |
| Pydantic | 2.8.2 | Request/response data validation |
| joblib | 1.4.2 | Model serialisation and persistence |
| matplotlib | 3.9.1 | Evaluation plot generation |
| seaborn | 0.13.2 | Statistical visualisation |

**Rationale for XGBoost:** XGBoost was selected over alternative classifiers (random forest, LightGBM, neural networks) based on three criteria. First, XGBoost's built-in L1 and L2 regularisation reduces overfitting on the imbalanced fraud dataset. Second, its `scale_pos_weight` parameter provides native support for cost-sensitive learning. Third, extensive benchmarking literature confirms XGBoost's superior performance on structured tabular data compared to deep learning alternatives that require substantially more training data.

**Rationale for FastAPI:** FastAPI was chosen over Flask and Django REST Framework for model serving due to its asynchronous request handling (critical for concurrent prediction requests), automatic request validation through Pydantic schemas, and built-in OpenAPI documentation generation.

### 3.2.2 Backend Development

| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | 18+ | Server-side JavaScript runtime |
| Express.js | 4.19.2 | HTTP server framework |
| Prisma | 5.18.0 | Object-Relational Mapping |
| PostgreSQL | 16 | Relational database |
| JSON Web Tokens | 9.0.2 | Stateless authentication |
| bcrypt.js | 2.4.3 | Password hashing |
| Zod | 3.23.8 | Schema validation |
| Helmet | 7.1.0 | HTTP security headers |
| express-rate-limit | 7.4.0 | API rate limiting |
| Axios | 1.7.4 | HTTP client (for ML API calls) |

**Rationale for Express.js:** Express.js provides a minimal, un-opinionated framework that allows fine-grained control over middleware composition. This project requires custom middleware for JWT verification, role-based authorisation, request validation, and error handling — responsibilities that Express.js supports cleanly through its middleware chain.

**Rationale for Prisma:** Prisma was selected over Sequelize and TypeORM for its type-safe query builder, automatic migration management, and declarative schema definition. The Prisma schema serves as a single source of truth for both the database structure and the JavaScript client types.

**Rationale for PostgreSQL:** PostgreSQL was chosen over MySQL and MongoDB for its robust transaction support (ACID compliance), advanced indexing capabilities, and native support for decimal precision required for financial amounts.

### 3.2.3 Frontend Development

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18.3.1 | Component-based UI framework |
| Vite | 5.4.0 | Build tool and dev server |
| React Router | 6.26.0 | Client-side routing |
| Tailwind CSS | 3.4.9 | Utility-first CSS framework |
| Recharts | 2.12.7 | Data visualisation charts |
| Axios | 1.7.4 | HTTP client |
| Lucide React | 0.424.0 | SVG icon library |
| react-hot-toast | 2.4.1 | Toast notification system |

**Rationale for React:** React's component model and unidirectional data flow provide a predictable architecture for building complex data dashboards. The custom hooks API enables clean extraction of data fetching logic from presentation components, improving code reusability and testability.

**Rationale for Vite:** Vite's native ES module support and hot module replacement provide sub-second feedback during development, significantly accelerating the frontend development cycle compared to webpack-based toolchains.

### 3.2.4 Development Environment

| Tool | Purpose |
|------|---------|
| Visual Studio Code | Primary code editor |
| Git | Version control |
| npm | Package management (Node.js) |
| pip | Package management (Python) |
| Postman | API testing and documentation |
| Chrome DevTools | Frontend debugging and profiling |

## 3.3 System Requirements

### 3.3.1 Hardware Requirements

| Component | Minimum Specification |
|-----------|----------------------|
| Processor | Intel Core i5 or Apple M1 equivalent |
| Memory | 8 GB RAM |
| Storage | 2 GB free disk space |
| Network | Internet connection (for package installation) |

### 3.3.2 Software Requirements

| Software | Minimum Version |
|----------|----------------|
| Operating System | macOS 12+, Ubuntu 20.04+, or Windows 10+ |
| Node.js | 18.0.0 |
| Python | 3.10 |
| PostgreSQL | 14.0 |
| npm | 9.0.0 |
| Web Browser | Chrome 90+, Firefox 88+, Safari 15+ |

## 3.4 Data Collection Strategy

This project generates synthetic transaction data rather than using real banking data, for two reasons:

1. **Regulatory Compliance.** Real UPI transaction data is classified as sensitive financial information under the RBI's Data Localisation norms and the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011. Accessing such data for academic research requires bank partnership and regulatory approvals that are outside the scope of a B.Tech project.

2. **Controlled Fraud Patterns.** Synthetic data allows precise control over the fraud rate, fraud types, and statistical distributions, enabling systematic evaluation of the model's detection capability under known conditions.

The data generator produces 50,000 transactions with the following characteristics:
- Transaction types distributed across P2P (peer-to-peer), P2M (peer-to-merchant), BILL (bill payments), and RECHARGE (mobile recharge) categories.
- Transaction amounts following a log-normal distribution reflecting realistic payment patterns (many small transactions, fewer large ones).
- Fraud rate set at 8 percent, higher than production rates (typically 0.1 to 1 percent) to provide sufficient positive samples for model training while maintaining meaningful class imbalance.
- Temporal distribution spanning weekdays and weekends with diurnal patterns (higher volume during business hours, lower at night).
- Fraudulent transactions exhibiting specific patterns: higher average amounts, concentration during night hours, rapid successive transactions, and anomalous balance ratios.

## 3.5 Evaluation Methodology

The machine learning model is evaluated using the following metrics:

**Accuracy** measures the overall fraction of correct predictions. While intuitive, accuracy is misleading for imbalanced datasets — a model that predicts all transactions as legitimate would achieve 92 percent accuracy on a dataset with 8 percent fraud rate.

**Precision** (for the fraud class) measures the fraction of transactions flagged as fraud that are actually fraudulent. High precision means fewer false alarms for legitimate users.

**Recall** (for the fraud class) measures the fraction of actual fraudulent transactions that the model successfully identifies. High recall means fewer fraudulent transactions slip through undetected. In fraud detection, recall is typically prioritised over precision because the cost of missing a fraud (financial loss, user trust damage) exceeds the cost of investigating a false alarm.

**F1-Score** is the harmonic mean of precision and recall, providing a single metric that balances both concerns.

**ROC-AUC** (Receiver Operating Characteristic — Area Under Curve) measures the model's ability to discriminate between fraud and legitimate transactions across all possible classification thresholds. An AUC of 1.0 indicates perfect discrimination; 0.5 indicates random guessing.

**Average Precision** summarises the precision-recall curve as a single number, giving more weight to improvements at higher recall levels. This metric is particularly informative for imbalanced datasets where the ROC-AUC may appear artificially high.

The model is evaluated on a held-out test set comprising 20 percent of the total data, with stratified splitting to maintain the fraud class proportion in both training and test sets.
