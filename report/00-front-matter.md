# DELHI TECHNOLOGICAL UNIVERSITY
## (Formerly Delhi College of Engineering)
### Bawana Road, Delhi — 110042

---

# MAJOR PROJECT REPORT

## Real-Time UPI Fraud Detection System Using Machine Learning

**Submitted in partial fulfilment of the requirements for the award of the degree of**

### Bachelor of Technology
### in
### [Department Name]

**Submitted by:**

[Student Name 1] — [Roll Number]
[Student Name 2] — [Roll Number]
[Student Name 3] — [Roll Number]
[Student Name 4] — [Roll Number]

**Under the supervision of:**

[Supervisor Name]
[Designation]
Department of [Department Name]
Delhi Technological University

**Session: 2024-25**

---

# CERTIFICATE

This is to certify that the Major Project Report entitled **"Real-Time UPI Fraud Detection System Using Machine Learning"** submitted by [Student Name 1] (Roll No: [Roll Number]), [Student Name 2] (Roll No: [Roll Number]), [Student Name 3] (Roll No: [Roll Number]), and [Student Name 4] (Roll No: [Roll Number]) in partial fulfilment of the requirements for the award of the degree of Bachelor of Technology in [Department Name] from Delhi Technological University, Delhi, is an authentic record of work carried out by them under my supervision and guidance.

The matter embodied in this report has not been submitted for the award of any other degree or diploma.

&nbsp;

**Date:**

&nbsp;

**[Supervisor Name]**
[Designation]
Department of [Department Name]
Delhi Technological University, Delhi

---

# DECLARATION

We hereby declare that the Major Project Report entitled **"Real-Time UPI Fraud Detection System Using Machine Learning"** submitted by us to the Department of [Department Name], Delhi Technological University, Delhi, in partial fulfilment of the requirements for the award of the degree of Bachelor of Technology, is a bona fide record of original work carried out by us. The matter embodied in this report has not been submitted for the award of any other degree or diploma of any university or institution.

&nbsp;

[Student Name 1] — [Roll Number]
[Student Name 2] — [Roll Number]
[Student Name 3] — [Roll Number]
[Student Name 4] — [Roll Number]

**Date:**
**Place:** Delhi

---

# ACKNOWLEDGEMENT

We would like to express our sincere gratitude to our project supervisor, **[Supervisor Name]**, [Designation], Department of [Department Name], Delhi Technological University, for providing invaluable guidance, constructive feedback, and constant encouragement throughout the duration of this project. The insightful suggestions at every stage of development shaped the direction and quality of this work.

We extend our thanks to **[HOD Name]**, Head of the Department of [Department Name], for providing the necessary infrastructure and academic environment that facilitated the completion of this project.

We are grateful to the faculty members of the Department of [Department Name] for the knowledge and skills imparted during the course of our B.Tech programme, which formed the foundation upon which this project was built.

We also thank our fellow students for their constructive discussions and the collegial atmosphere that contributed to a productive working environment.

Finally, we are deeply indebted to our families for their unwavering support, patience, and encouragement throughout our academic journey.

&nbsp;

[Student Name 1]
[Student Name 2]
[Student Name 3]
[Student Name 4]

---

# ABSTRACT

The rapid adoption of the Unified Payments Interface (UPI) in India, processing over 11 billion transactions per month, has created a parallel increase in fraudulent activities targeting digital payment users. Traditional rule-based fraud detection systems suffer from high false positive rates and inability to adapt to evolving fraud tactics. This project presents the design, implementation, and evaluation of a real-time UPI fraud detection system that employs XGBoost gradient boosting classification combined with a comprehensive feature engineering pipeline tailored to UPI transaction characteristics.

The system transforms six raw transaction attributes into twenty-eight derived features spanning five categories: amount characteristics, balance dynamics, temporal patterns, user behavioural history, and categorical encodings. The XGBoost classifier, trained on 50,000 synthetic UPI transactions with SMOTE (Synthetic Minority Over-sampling Technique) applied to address class imbalance, achieves a fraud detection recall of 94 percent and a precision of 85 percent on the held-out test set, with an ROC-AUC score of 0.987.

The trained model is deployed as a FastAPI inference service with a prediction latency of 28 milliseconds. An Express.js backend orchestrates the complete transaction lifecycle including authentication, fraud scoring, balance management, and alert generation. A React-based dashboard provides real-time monitoring with KPI visualisations, transaction management, alert handling, and analytical views.

The system implements a dual-mode detection architecture where a rule-based fallback mechanism activates automatically when the machine learning service is unavailable, ensuring uninterrupted fraud monitoring. Comparative evaluation demonstrates that the machine learning model outperforms the rule-based baseline across all metrics, with a 22 percentage-point improvement in fraud recall and a 43 percentage-point improvement in fraud precision.

**Keywords:** UPI, fraud detection, machine learning, XGBoost, gradient boosting, feature engineering, SMOTE, real-time prediction, web application, React, FastAPI, Express.js

---

# TABLE OF CONTENTS

| Chapter | Title | Page |
|---------|-------|------|
| | Certificate | i |
| | Declaration | ii |
| | Acknowledgement | iii |
| | Abstract | iv |
| | Table of Contents | v |
| | List of Figures | vii |
| | List of Tables | viii |
| | List of Abbreviations | ix |
| 1 | Introduction | 1 |
| 1.1 | Background of the Study | 1 |
| 1.2 | Motivation | 3 |
| 1.3 | Problem Statement | 4 |
| 1.4 | Objectives | 5 |
| 1.5 | Scope of the Project | 6 |
| 1.6 | Organisation of the Report | 7 |
| 2 | Literature Survey | 8 |
| 2.1 | Overview | 8 |
| 2.2 | Rule-Based Fraud Detection Systems | 8 |
| 2.3 | Machine Learning for Financial Fraud Detection | 9 |
| 2.4 | Handling Class Imbalance | 12 |
| 2.5 | Feature Engineering for Payment Fraud | 13 |
| 2.6 | UPI-Specific Security Research | 14 |
| 2.7 | Web Application Frameworks for ML Deployment | 15 |
| 2.8 | Summary of Literature Gaps | 16 |
| 3 | Methodology | 17 |
| 3.1 | Development Approach | 17 |
| 3.2 | Tools and Technologies | 18 |
| 3.3 | System Requirements | 21 |
| 3.4 | Data Collection Strategy | 22 |
| 3.5 | Evaluation Methodology | 23 |
| 4 | System Architecture and Design | 25 |
| 4.1 | High-Level Architecture | 25 |
| 4.2 | Component Design | 26 |
| 4.3 | Authentication and Authorisation Design | 30 |
| 4.4 | Data Flow for Transaction Processing | 31 |
| 4.5 | Error Handling Architecture | 33 |
| 5 | Database Design | 34 |
| 5.1 | Database Selection and Justification | 34 |
| 5.2 | Entity-Relationship Model | 35 |
| 5.3 | Schema Specification | 36 |
| 5.4 | Referential Integrity | 39 |
| 5.5 | Data Volume Considerations | 40 |
| 5.6 | Schema Migration Strategy | 40 |
| 6 | Machine Learning Workflow | 41 |
| 6.1 | Overview | 41 |
| 6.2 | Synthetic Data Generation | 41 |
| 6.3 | Feature Engineering | 43 |
| 6.4 | Data Preprocessing | 48 |
| 6.5 | Model Training | 50 |
| 6.6 | Model Evaluation | 52 |
| 6.7 | Fraud Threshold Configuration | 54 |
| 6.8 | Rule-Based Fallback Scoring | 55 |
| 7 | Implementation | 56 |
| 7.1 | Project Structure | 56 |
| 7.2 | Backend Implementation | 57 |
| 7.3 | ML Service Implementation | 62 |
| 7.4 | Frontend Implementation | 65 |
| 7.5 | Styling Implementation | 70 |
| 8 | Results and Evaluation | 71 |
| 8.1 | Model Performance Results | 71 |
| 8.2 | System Performance Results | 76 |
| 8.3 | Rule-Based Fallback Comparison | 78 |
| 8.4 | Impact of SMOTE Oversampling | 79 |
| 8.5 | Discussion | 80 |
| 9 | Application Interface | 81 |
| 9.1 | Login Page | 81 |
| 9.2 | Dashboard | 82 |
| 9.3 | Transactions Page | 84 |
| 9.4 | Check Transaction Page | 85 |
| 9.5 | Alerts Page | 86 |
| 9.6 | Analytics Page | 87 |
| 9.7 | Navigation and Layout | 88 |
| 10 | Testing and Validation | 89 |
| 10.1 | Testing Strategy | 89 |
| 10.2 | API Endpoint Testing | 89 |
| 10.3 | Integration Testing | 93 |
| 10.4 | Frontend Validation Testing | 95 |
| 10.5 | Performance Testing | 96 |
| 10.6 | Security Testing | 97 |
| 10.7 | Known Issues and Limitations | 98 |
| 11 | Conclusion | 99 |
| 11.1 | Summary of Work | 99 |
| 11.2 | Objectives Achieved | 100 |
| 11.3 | Contributions | 102 |
| 11.4 | Lessons Learned | 103 |
| 12 | Future Scope | 104 |
| 12.1 | Real-Time Streaming Pipeline | 104 |
| 12.2 | Advanced Model Architectures | 104 |
| 12.3 | Real Transaction Data Integration | 105 |
| 12.4 | Explainable AI Integration | 106 |
| 12.5 | Mobile Application | 106 |
| 12.6 | Cloud Deployment and Scaling | 107 |
| 12.7 | Concept Drift Detection | 107 |
| 12.8 | Multi-Factor Risk Assessment | 108 |
| 12.9 | Regulatory Compliance Module | 108 |
| 12.10 | Summary | 109 |
| | References | 110 |

---

# LIST OF FIGURES

| Figure | Title | Page |
|--------|-------|------|
| 4.1 | High-Level System Architecture | 25 |
| 4.2 | Frontend Component Hierarchy | 27 |
| 4.3 | Backend Layered Architecture | 28 |
| 4.4 | ML Service Architecture | 29 |
| 4.5 | Transaction Processing Data Flow | 31 |
| 5.1 | Entity-Relationship Diagram | 35 |
| 6.1 | Feature Engineering Pipeline | 43 |
| 6.2 | SMOTE Oversampling Process | 49 |
| 6.3 | XGBoost Training Pipeline | 51 |
| 8.1 | Confusion Matrix | 72 |
| 8.2 | ROC Curve | 73 |
| 8.3 | Precision-Recall Curve | 74 |
| 8.4 | Feature Importance (Top 20) | 75 |
| 8.5 | Fraud Probability Distribution | 76 |
| 9.1 | Login Page | 81 |
| 9.2 | Dashboard Overview | 82 |
| 9.3 | Transactions Page with Filters | 84 |
| 9.4 | Check Transaction Form and Result | 85 |
| 9.5 | Alerts Management Page | 86 |
| 9.6 | Analytics Page | 87 |

---

# LIST OF TABLES

| Table | Title | Page |
|-------|-------|------|
| 3.1 | ML and Data Processing Technologies | 18 |
| 3.2 | Backend Technologies | 19 |
| 3.3 | Frontend Technologies | 20 |
| 3.4 | Hardware Requirements | 21 |
| 3.5 | Software Requirements | 21 |
| 5.1 | Users Table Schema | 36 |
| 5.2 | Transactions Table Schema | 37 |
| 5.3 | Alerts Table Schema | 38 |
| 6.1 | XGBoost Hyperparameters | 50 |
| 6.2 | Fraud Threshold Configuration | 54 |
| 6.3 | Rule-Based Scoring Rules | 55 |
| 8.1 | Overall Classification Metrics | 71 |
| 8.2 | Per-Class Classification Report | 72 |
| 8.3 | Confusion Matrix | 72 |
| 8.4 | Feature Importance Rankings | 75 |
| 8.5 | API Response Times | 76 |
| 8.6 | Fraud Detection by Transaction Type | 77 |
| 8.7 | Fraud Detection by Time Period | 77 |
| 8.8 | ML Model vs Rule-Based Comparison | 78 |
| 8.9 | SMOTE Impact Analysis | 79 |
| 10.1 | Authentication Endpoint Tests | 89 |
| 10.2 | Transaction Endpoint Tests | 90 |
| 10.3 | Alert Endpoint Tests | 91 |
| 10.4 | Page Load Times | 96 |
| 10.5 | Concurrent User Performance | 96 |

---

# LIST OF ABBREVIATIONS

| Abbreviation | Full Form |
|-------------|-----------|
| ACID | Atomicity, Consistency, Isolation, Durability |
| API | Application Programming Interface |
| ASGI | Asynchronous Server Gateway Interface |
| AUC | Area Under the Curve |
| CORS | Cross-Origin Resource Sharing |
| CRUD | Create, Read, Update, Delete |
| CSS | Cascading Style Sheets |
| CSV | Comma-Separated Values |
| DOM | Document Object Model |
| DTU | Delhi Technological University |
| GNN | Graph Neural Network |
| HTML | HyperText Markup Language |
| HTTP | HyperText Transfer Protocol |
| I4C | Indian Cyber Crime Coordination Centre |
| INR | Indian Rupee |
| IQR | Interquartile Range |
| JSON | JavaScript Object Notation |
| JWT | JSON Web Token |
| KPI | Key Performance Indicator |
| LSTM | Long Short-Term Memory |
| ML | Machine Learning |
| MVCC | Multi-Version Concurrency Control |
| NPCI | National Payments Corporation of India |
| ORM | Object-Relational Mapping |
| P2M | Peer-to-Merchant |
| P2P | Peer-to-Peer |
| RBAC | Role-Based Access Control |
| RBI | Reserve Bank of India |
| REST | Representational State Transfer |
| ROC | Receiver Operating Characteristic |
| SHAP | SHapley Additive exPlanations |
| SMOTE | Synthetic Minority Over-sampling Technique |
| SPA | Single Page Application |
| SQL | Structured Query Language |
| SVG | Scalable Vector Graphics |
| TCP | Transmission Control Protocol |
| UI | User Interface |
| UPI | Unified Payments Interface |
| URL | Uniform Resource Locator |
| UUID | Universally Unique Identifier |
| VPA | Virtual Payment Address |
| XGBoost | Extreme Gradient Boosting |
| XSS | Cross-Site Scripting |
