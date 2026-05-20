npm warn Unknown user config "timeout". This will stop working in the next major version of npm.
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'ANALYST');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('P2P', 'P2M', 'BILL', 'RECHARGE');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'FLAGGED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('FRAUD_DETECTED', 'SUSPICIOUS_ACTIVITY', 'HIGH_AMOUNT', 'RAPID_TRANSACTIONS', 'ACCOUNT_ANOMALY');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "upi_id" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(15),
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 10000.00,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" SERIAL NOT NULL,
    "transaction_id" VARCHAR(50) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "transaction_type" "TransactionType" NOT NULL DEFAULT 'P2P',
    "is_fraud" BOOLEAN NOT NULL DEFAULT false,
    "fraud_probability" DECIMAL(5,4) NOT NULL DEFAULT 0.0000,
    "risk_level" VARCHAR(10) NOT NULL DEFAULT 'LOW',
    "sender_balance_before" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "receiver_balance_before" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "status" "TransactionStatus" NOT NULL DEFAULT 'COMPLETED',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "sender_id" INTEGER,
    "receiver_id" INTEGER,
    "sender_upi" VARCHAR(100) NOT NULL,
    "receiver_upi" VARCHAR(100) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" SERIAL NOT NULL,
    "type" "AlertType" NOT NULL,
    "severity" "Severity" NOT NULL DEFAULT 'MEDIUM',
    "title" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "user_id" INTEGER,
    "transaction_id" INTEGER,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_upi_id_key" ON "users"("upi_id");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_transaction_id_key" ON "transactions"("transaction_id");

-- CreateIndex
CREATE INDEX "idx_transactions_is_fraud" ON "transactions"("is_fraud");

-- CreateIndex
CREATE INDEX "idx_transactions_created_at" ON "transactions"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_transactions_sender" ON "transactions"("sender_upi");

-- CreateIndex
CREATE INDEX "idx_transactions_receiver" ON "transactions"("receiver_upi");

-- CreateIndex
CREATE INDEX "idx_transactions_status" ON "transactions"("status");

-- CreateIndex
CREATE INDEX "idx_alerts_severity" ON "alerts"("severity");

-- CreateIndex
CREATE INDEX "idx_alerts_is_read" ON "alerts"("is_read");

-- CreateIndex
CREATE INDEX "idx_alerts_created_at" ON "alerts"("created_at" DESC);

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

