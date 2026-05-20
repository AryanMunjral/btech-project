# CHAPTER 5: DATABASE DESIGN

## 5.1 Database Selection and Justification

PostgreSQL 16 was selected as the relational database management system for this project. The choice was driven by several technical requirements specific to financial transaction systems:

**Decimal Precision.** Financial applications require exact decimal arithmetic to prevent rounding errors that accumulate over large transaction volumes. PostgreSQL's DECIMAL(12,2) type stores amounts with exact two-decimal-place precision, unlike floating-point types that introduce representation errors. For fraud probability scores, DECIMAL(5,4) provides four-decimal-place precision, supporting fine-grained risk differentiation.

**ACID Compliance.** When a transaction is processed, multiple database operations must execute atomically — creating the transaction record, updating sender and receiver balances, and generating alert records. PostgreSQL's full ACID (Atomicity, Consistency, Isolation, Durability) transaction support ensures that either all operations succeed or none do, preventing inconsistent states such as debited balances without corresponding transaction records.

**Indexing.** The application frequently queries transactions by fraud status, creation date, sender UPI, and receiver UPI. PostgreSQL's B-tree indexes on these columns reduce query complexity from linear table scans to logarithmic index lookups, essential for maintaining responsive page loads as the transaction volume grows.

**Concurrent Access.** Multiple users (administrators, analysts, regular users) access the system simultaneously. PostgreSQL's MVCC (Multi-Version Concurrency Control) architecture allows concurrent reads and writes without lock contention, ensuring that dashboard statistics queries do not block incoming transaction creation.

## 5.2 Entity-Relationship Model

The database consists of three primary entities with the following relationships:

```
┌──────────────┐       1         *  ┌──────────────────┐
│              │───── sends ───────>│                  │
│    User      │                    │   Transaction    │
│              │<── receives ──────>│                  │
│  (id, name,  │       1         *  │  (id, txnId,     │
│   email,     │                    │   amount, type,  │
│   password,  │                    │   isFraud,       │
│   upiId,     │       1         *  │   probability,   │
│   balance,   │───── has ────────>│   status, ...)   │
│   role)      │                    └───────┬──────────┘
│              │       1         *          │ 0..1
│              │───── receives ──>┌─────────┴──────────┐
└──────────────┘                  │      Alert         │
                                  │  (id, type,        │
                                  │   severity, title, │
                                  │   message,         │
                                  │   isRead,          │
                                  │   resolved)        │
                                  └────────────────────┘
```

**Relationships:**
- A User can send many Transactions (one-to-many via senderId).
- A User can receive many Transactions (one-to-many via receiverId).
- A User can have many Alerts (one-to-many via userId).
- A Transaction can generate zero or one Alert (one-to-one via transactionId).

## 5.3 Schema Specification

### 5.3.1 Users Table

The Users table stores account information for all system users, including authentication credentials and financial balance.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO INCREMENT | Unique user identifier |
| name | VARCHAR(100) | NOT NULL | Full name of the user |
| email | VARCHAR(150) | NOT NULL, UNIQUE | Email address for login |
| password | VARCHAR(255) | NOT NULL | bcrypt-hashed password |
| upiId | VARCHAR(100) | UNIQUE | Virtual Payment Address |
| phone | VARCHAR(15) | NULLABLE | Contact number |
| balance | DECIMAL(12,2) | DEFAULT 10000.00 | Account balance in INR |
| isActive | BOOLEAN | DEFAULT true | Account active status |
| role | ENUM | DEFAULT 'USER' | USER, ADMIN, or ANALYST |
| createdAt | TIMESTAMPTZ | DEFAULT now() | Account creation timestamp |
| updatedAt | TIMESTAMPTZ | AUTO-UPDATED | Last modification timestamp |

**Design Decisions:**
- Passwords are stored as bcrypt hashes with a salt factor of 10, not in plaintext.
- The default balance of ₹10,000 enables immediate testing of the demo application without requiring a funding step.
- The role enumeration is enforced at the database level, preventing insertion of invalid roles.
- Email uniqueness is enforced by a database-level unique constraint, not just application-level validation, to prevent race conditions during concurrent registration.

### 5.3.2 Transactions Table

The Transactions table is the central entity of the system, recording every payment along with its fraud assessment.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO INCREMENT | Unique record identifier |
| transactionId | VARCHAR(50) | NOT NULL, UNIQUE | Human-readable transaction ID |
| amount | DECIMAL(12,2) | NOT NULL | Transaction amount in INR |
| transactionType | ENUM | DEFAULT 'P2P' | P2P, P2M, BILL, or RECHARGE |
| isFraud | BOOLEAN | DEFAULT false | Fraud classification result |
| fraudProbability | DECIMAL(5,4) | DEFAULT 0.0000 | ML model confidence (0 to 1) |
| riskLevel | VARCHAR(10) | DEFAULT 'LOW' | LOW, MEDIUM, or HIGH |
| senderBalanceBefore | DECIMAL(12,2) | NOT NULL | Sender balance at transaction time |
| receiverBalanceBefore | DECIMAL(12,2) | NOT NULL | Receiver balance at transaction time |
| status | ENUM | DEFAULT 'COMPLETED' | PENDING, COMPLETED, FAILED, FLAGGED, BLOCKED |
| senderId | INTEGER | FOREIGN KEY (nullable) | Reference to sender User |
| receiverId | INTEGER | FOREIGN KEY (nullable) | Reference to receiver User |
| senderUpi | VARCHAR(100) | NOT NULL | Sender's UPI address |
| receiverUpi | VARCHAR(100) | NOT NULL | Receiver's UPI address |
| createdAt | TIMESTAMPTZ | DEFAULT now() | Transaction timestamp |
| updatedAt | TIMESTAMPTZ | AUTO-UPDATED | Last modification timestamp |

**Indexes:**
- `idx_transactions_isFraud` on `isFraud` — Enables fast filtering of fraudulent transactions for the dashboard and alerts pages.
- `idx_transactions_createdAt` on `createdAt DESC` — Optimises the common query pattern of fetching the most recent transactions.
- `idx_transactions_senderUpi` on `senderUpi` — Supports lookups of all transactions by a specific sender.
- `idx_transactions_receiverUpi` on `receiverUpi` — Supports lookups of all transactions received by a specific user.
- `idx_transactions_status` on `status` — Enables filtering by transaction status (FLAGGED, BLOCKED, etc.).

**Design Decisions:**
- The `senderBalanceBefore` and `receiverBalanceBefore` fields capture the balances at the time of the transaction. These are used by the ML model as features and provide an audit trail that is independent of subsequent balance changes.
- The `fraudProbability` field stores the raw model output, while `isFraud` and `riskLevel` store the threshold-derived classifications. Storing both allows analysts to adjust thresholds without re-running predictions.
- Foreign keys for `senderId` and `receiverId` are nullable to support transactions involving external (unregistered) UPI addresses.
- The `transactionId` field follows the format `TXN{timestamp}{uuid}`, providing a human-readable reference that encodes the creation time for quick temporal identification.

### 5.3.3 Alerts Table

The Alerts table stores fraud alerts and system notifications generated by the fraud detection pipeline.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO INCREMENT | Unique alert identifier |
| type | ENUM | NOT NULL | Alert category |
| severity | ENUM | DEFAULT 'MEDIUM' | LOW, MEDIUM, HIGH, or CRITICAL |
| title | VARCHAR(200) | NOT NULL | Short alert description |
| message | TEXT | NOT NULL | Detailed alert information |
| isRead | BOOLEAN | DEFAULT false | Read status |
| resolved | BOOLEAN | DEFAULT false | Resolution status |
| userId | INTEGER | FOREIGN KEY (nullable) | Associated user |
| transactionId | INTEGER | FOREIGN KEY (nullable) | Associated transaction |
| createdAt | TIMESTAMPTZ | DEFAULT now() | Alert creation timestamp |
| updatedAt | TIMESTAMPTZ | AUTO-UPDATED | Last modification timestamp |

**Alert Type Enumeration:**
- `FRAUD_DETECTED` — ML model classifies a transaction as fraudulent (probability ≥ 0.50).
- `SUSPICIOUS_ACTIVITY` — Transaction exhibits suspicious characteristics but falls below the fraud threshold (probability between 0.30 and 0.50).
- `HIGH_AMOUNT` — Transaction amount exceeds the high-value threshold (₹50,000).
- `RAPID_TRANSACTIONS` — A sender has made three or more transactions within a five-minute window.
- `ACCOUNT_ANOMALY` — Unusual account behaviour detected (reserved for future use).

**Indexes:**
- `idx_alerts_severity` on `severity` — Supports filtering alerts by severity for the alerts page.
- `idx_alerts_isRead` on `isRead` — Enables efficient querying of unread alerts for the notification badge.
- `idx_alerts_createdAt` on `createdAt DESC` — Optimises chronological alert listing.

## 5.4 Referential Integrity

The schema enforces referential integrity through foreign key constraints with specific cascade behaviours:

- `Transaction.senderId → User.id` with `SET NULL` on delete — if a user account is deleted, their sent transactions are preserved for audit purposes but the sender reference is set to null.
- `Transaction.receiverId → User.id` with `SET NULL` on delete — same behaviour for received transactions.
- `Alert.userId → User.id` with `SET NULL` on delete — alerts remain in the system for audit history even if the associated user is removed.
- `Alert.transactionId → Transaction.id` with `SET NULL` on delete — alerts persist independently of transaction records.

The choice of SET NULL over CASCADE DELETE reflects the audit requirements of financial systems — transaction and alert records must never be automatically deleted when a user account is removed.

## 5.5 Data Volume Considerations

The database schema is designed to handle the following projected data volumes for demonstration and academic evaluation purposes:

| Entity | Expected Volume | Growth Rate |
|--------|----------------|-------------|
| Users | 10 - 100 | Low (manual registration) |
| Transactions | 50,000+ | ~200 per demo session |
| Alerts | 5,000+ | ~1 per 10 transactions |

For the indexed columns identified above, PostgreSQL's B-tree indexes provide O(log n) lookup performance, ensuring sub-millisecond query times even as the transaction count grows into the hundreds of thousands. The `createdAt DESC` index on the Transactions table specifically optimises the dashboard's "recent transactions" query, which is the most frequently executed query in the application.

## 5.6 Schema Migration Strategy

The project uses Prisma's `db push` command for schema synchronisation during development. This approach directly applies the schema defined in `schema.prisma` to the PostgreSQL database, creating or altering tables as needed. For a production deployment, Prisma's migration system (`prisma migrate dev`) would be used instead, generating versioned SQL migration files that can be reviewed, tested, and applied in sequence across environments.
