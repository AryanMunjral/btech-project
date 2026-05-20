/**
 * Prisma Seed Script
 *
 * Populates the database with demo Users, Transactions, and Alerts.
 *
 * Usage:
 *   npx prisma db seed
 *   (or)  node prisma/seed.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  // ── 1. Create Users ──────────────────────────────────
  const hashedPassword = await bcrypt.hash('password123', 10);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'rahul.sharma@email.com' },
      update: {},
      create: {
        name: 'Rahul Sharma',
        email: 'rahul.sharma@email.com',
        password: hashedPassword,
        upiId: 'rahul.sharma@paytm',
        phone: '9876543210',
        balance: 25000.0,
        role: 'USER',
      },
    }),
    prisma.user.upsert({
      where: { email: 'priya.patel@email.com' },
      update: {},
      create: {
        name: 'Priya Patel',
        email: 'priya.patel@email.com',
        password: hashedPassword,
        upiId: 'priya.patel@oksbi',
        phone: '9876543211',
        balance: 45000.0,
        role: 'USER',
      },
    }),
    prisma.user.upsert({
      where: { email: 'amit.kumar@email.com' },
      update: {},
      create: {
        name: 'Amit Kumar',
        email: 'amit.kumar@email.com',
        password: hashedPassword,
        upiId: 'amit.kumar@ibl',
        phone: '9876543212',
        balance: 30000.0,
        role: 'USER',
      },
    }),
    prisma.user.upsert({
      where: { email: 'sneha.reddy@email.com' },
      update: {},
      create: {
        name: 'Sneha Reddy',
        email: 'sneha.reddy@email.com',
        password: hashedPassword,
        upiId: 'sneha.reddy@ybl',
        phone: '9876543213',
        balance: 55000.0,
        role: 'USER',
      },
    }),
    prisma.user.upsert({
      where: { email: 'vikram.singh@email.com' },
      update: {},
      create: {
        name: 'Vikram Singh',
        email: 'vikram.singh@email.com',
        password: hashedPassword,
        upiId: 'vikram.singh@paytm',
        phone: '9876543214',
        balance: 18000.0,
        role: 'USER',
      },
    }),
    prisma.user.upsert({
      where: { email: 'admin@upifraud.com' },
      update: {},
      create: {
        name: 'Admin User',
        email: 'admin@upifraud.com',
        password: await bcrypt.hash('admin123', 10),
        upiId: 'admin@upifraud',
        phone: '9000000001',
        balance: 0.0,
        role: 'ADMIN',
      },
    }),
    prisma.user.upsert({
      where: { email: 'analyst@upifraud.com' },
      update: {},
      create: {
        name: 'Fraud Analyst',
        email: 'analyst@upifraud.com',
        password: await bcrypt.hash('analyst123', 10),
        upiId: 'analyst@upifraud',
        phone: '9000000002',
        balance: 0.0,
        role: 'ANALYST',
      },
    }),
  ]);

  console.log(`  ✅ ${users.length} users created`);

  // ── 2. Create Legitimate Transactions ────────────────
  const legitTransactions = [
    {
      transactionId: 'TXN20240801001',
      senderUpi: 'rahul.sharma@paytm',
      receiverUpi: 'grocery.store@ybl',
      amount: 450.0,
      transactionType: 'P2M',
      isFraud: false,
      fraudProbability: 0.052,
      riskLevel: 'LOW',
      senderBalanceBefore: 25000.0,
      receiverBalanceBefore: 150000.0,
      status: 'COMPLETED',
      senderId: users[0].id,
    },
    {
      transactionId: 'TXN20240801002',
      senderUpi: 'priya.patel@oksbi',
      receiverUpi: 'flipkart@axl',
      amount: 2999.0,
      transactionType: 'P2M',
      isFraud: false,
      fraudProbability: 0.081,
      riskLevel: 'LOW',
      senderBalanceBefore: 45000.0,
      receiverBalanceBefore: 500000.0,
      status: 'COMPLETED',
      senderId: users[1].id,
    },
    {
      transactionId: 'TXN20240802001',
      senderUpi: 'amit.kumar@ibl',
      receiverUpi: 'rahul.sharma@paytm',
      amount: 1500.0,
      transactionType: 'P2P',
      isFraud: false,
      fraudProbability: 0.03,
      riskLevel: 'LOW',
      senderBalanceBefore: 30000.0,
      receiverBalanceBefore: 25000.0,
      status: 'COMPLETED',
      senderId: users[2].id,
      receiverId: users[0].id,
    },
    {
      transactionId: 'TXN20240802002',
      senderUpi: 'sneha.reddy@ybl',
      receiverUpi: 'electricity.board@oksbi',
      amount: 3200.0,
      transactionType: 'BILL',
      isFraud: false,
      fraudProbability: 0.015,
      riskLevel: 'LOW',
      senderBalanceBefore: 55000.0,
      receiverBalanceBefore: 900000.0,
      status: 'COMPLETED',
      senderId: users[3].id,
    },
    {
      transactionId: 'TXN20240803001',
      senderUpi: 'vikram.singh@paytm',
      receiverUpi: 'airtel@ibl',
      amount: 599.0,
      transactionType: 'RECHARGE',
      isFraud: false,
      fraudProbability: 0.02,
      riskLevel: 'LOW',
      senderBalanceBefore: 18000.0,
      receiverBalanceBefore: 1000000.0,
      status: 'COMPLETED',
      senderId: users[4].id,
    },
    {
      transactionId: 'TXN20240804001',
      senderUpi: 'rahul.sharma@paytm',
      receiverUpi: 'sneha.reddy@ybl',
      amount: 5000.0,
      transactionType: 'P2P',
      isFraud: false,
      fraudProbability: 0.12,
      riskLevel: 'LOW',
      senderBalanceBefore: 26500.0,
      receiverBalanceBefore: 51800.0,
      status: 'COMPLETED',
      senderId: users[0].id,
      receiverId: users[3].id,
    },
    {
      transactionId: 'TXN20240805001',
      senderUpi: 'priya.patel@oksbi',
      receiverUpi: 'amazon@axl',
      amount: 7499.0,
      transactionType: 'P2M',
      isFraud: false,
      fraudProbability: 0.09,
      riskLevel: 'LOW',
      senderBalanceBefore: 42001.0,
      receiverBalanceBefore: 2000000.0,
      status: 'COMPLETED',
      senderId: users[1].id,
    },
    {
      transactionId: 'TXN20240805002',
      senderUpi: 'amit.kumar@ibl',
      receiverUpi: 'restaurant@ybl',
      amount: 1800.0,
      transactionType: 'P2M',
      isFraud: false,
      fraudProbability: 0.035,
      riskLevel: 'LOW',
      senderBalanceBefore: 28500.0,
      receiverBalanceBefore: 120000.0,
      status: 'COMPLETED',
      senderId: users[2].id,
    },
    {
      transactionId: 'TXN20240806001',
      senderUpi: 'vikram.singh@paytm',
      receiverUpi: 'taxi.driver@paytm',
      amount: 320.0,
      transactionType: 'P2P',
      isFraud: false,
      fraudProbability: 0.025,
      riskLevel: 'LOW',
      senderBalanceBefore: 17401.0,
      receiverBalanceBefore: 3000.0,
      status: 'COMPLETED',
      senderId: users[4].id,
    },
    {
      transactionId: 'TXN20240806002',
      senderUpi: 'sneha.reddy@ybl',
      receiverUpi: 'jio@ibl',
      amount: 399.0,
      transactionType: 'RECHARGE',
      isFraud: false,
      fraudProbability: 0.018,
      riskLevel: 'LOW',
      senderBalanceBefore: 46800.0,
      receiverBalanceBefore: 5000000.0,
      status: 'COMPLETED',
      senderId: users[3].id,
    },
  ];

  // ── 3. Create Fraudulent Transactions ────────────────
  const fraudTransactions = [
    {
      transactionId: 'TXN20240801099',
      senderUpi: 'unknown123@axl',
      receiverUpi: 'random.acct@ybl',
      amount: 49999.0,
      transactionType: 'P2P',
      isFraud: true,
      fraudProbability: 0.92,
      riskLevel: 'HIGH',
      senderBalanceBefore: 5000.0,
      receiverBalanceBefore: 200.0,
      status: 'FLAGGED',
    },
    {
      transactionId: 'TXN20240803099',
      senderUpi: 'temp.user@paytm',
      receiverUpi: 'suspect.acct@ibl',
      amount: 75000.0,
      transactionType: 'P2P',
      isFraud: true,
      fraudProbability: 0.88,
      riskLevel: 'HIGH',
      senderBalanceBefore: 12000.0,
      receiverBalanceBefore: 500.0,
      status: 'BLOCKED',
    },
    {
      transactionId: 'TXN20240805099',
      senderUpi: 'new.user99@ybl',
      receiverUpi: 'offshore@axl',
      amount: 95000.0,
      transactionType: 'P2P',
      isFraud: true,
      fraudProbability: 0.95,
      riskLevel: 'HIGH',
      senderBalanceBefore: 8000.0,
      receiverBalanceBefore: 100.0,
      status: 'BLOCKED',
    },
    {
      transactionId: 'TXN20240806099',
      senderUpi: 'hacked.acct@oksbi',
      receiverUpi: 'mule@paytm',
      amount: 45000.0,
      transactionType: 'P2P',
      isFraud: true,
      fraudProbability: 0.86,
      riskLevel: 'HIGH',
      senderBalanceBefore: 45000.0,
      receiverBalanceBefore: 1000.0,
      status: 'FLAGGED',
    },
    {
      transactionId: 'TXN20240806100',
      senderUpi: 'stolen.id@ibl',
      receiverUpi: 'fake.shop@ybl',
      amount: 28000.0,
      transactionType: 'P2M',
      isFraud: true,
      fraudProbability: 0.78,
      riskLevel: 'HIGH',
      senderBalanceBefore: 30000.0,
      receiverBalanceBefore: 5000.0,
      status: 'FLAGGED',
    },
  ];

  const allTransactions = [...legitTransactions, ...fraudTransactions];

  let txnCount = 0;
  const createdTransactions = [];

  for (const txn of allTransactions) {
    const created = await prisma.transaction.upsert({
      where: { transactionId: txn.transactionId },
      update: {},
      create: txn,
    });
    createdTransactions.push(created);
    txnCount++;
  }

  console.log(`  ✅ ${txnCount} transactions created (${fraudTransactions.length} fraudulent)`);

  // ── 4. Create Alerts for Fraud Transactions ──────────
  const fraudTxns = createdTransactions.filter((t) => t.isFraud);

  const alertsData = [
    {
      type: 'FRAUD_DETECTED',
      severity: 'CRITICAL',
      title: 'High-value fraud: ₹49,999 from unknown account',
      message:
        'Transaction TXN20240801099 flagged with 92% fraud probability. Amount of ₹49,999 transferred from unknown123@axl to random.acct@ybl. Sender balance was only ₹5,000.',
      transactionId: fraudTxns[0]?.id,
    },
    {
      type: 'FRAUD_DETECTED',
      severity: 'CRITICAL',
      title: 'Blocked: ₹75,000 suspicious P2P transfer',
      message:
        'Transaction TXN20240803099 blocked. Amount ₹75,000 is 6.25x sender balance. Probability: 88%.',
      transactionId: fraudTxns[1]?.id,
    },
    {
      type: 'FRAUD_DETECTED',
      severity: 'CRITICAL',
      title: 'Blocked: ₹95,000 to offshore account',
      message:
        'Transaction TXN20240805099 blocked. Highest fraud probability (95%) detected. Amount ₹95,000 from new.user99@ybl to offshore@axl.',
      transactionId: fraudTxns[2]?.id,
    },
    {
      type: 'ACCOUNT_ANOMALY',
      severity: 'HIGH',
      title: 'Account drain attempt: hacked.acct@oksbi',
      message:
        'Transaction TXN20240806099: Full balance drain attempt. ₹45,000 equals 100% of sender balance. Likely compromised account.',
      transactionId: fraudTxns[3]?.id,
    },
    {
      type: 'SUSPICIOUS_ACTIVITY',
      severity: 'HIGH',
      title: 'Suspicious merchant: fake.shop@ybl',
      message:
        'Transaction TXN20240806100 to unverified merchant fake.shop@ybl. Amount ₹28,000 with 78% fraud probability.',
      transactionId: fraudTxns[4]?.id,
    },
    {
      type: 'RAPID_TRANSACTIONS',
      severity: 'MEDIUM',
      title: 'Rapid transaction pattern detected',
      message:
        'Multiple high-value transactions detected from different accounts within a short time window. Could indicate coordinated fraud ring.',
    },
  ];

  let alertCount = 0;
  for (const alert of alertsData) {
    if (alert.transactionId) {
      await prisma.alert.create({ data: alert });
    } else {
      await prisma.alert.create({
        data: {
          type: alert.type,
          severity: alert.severity,
          title: alert.title,
          message: alert.message,
        },
      });
    }
    alertCount++;
  }

  console.log(`  ✅ ${alertCount} alerts created`);

  console.log('\n✅ Database seeded successfully!');
  console.log('\n📋 Summary:');
  console.log(`   Users:        ${users.length} (incl. 1 admin, 1 analyst)`);
  console.log(`   Transactions: ${txnCount} (${fraudTransactions.length} fraud, ${legitTransactions.length} legit)`);
  console.log(`   Alerts:       ${alertCount}`);
  console.log('\n🔑 Demo credentials:');
  console.log('   Admin:   admin@upifraud.com / admin123');
  console.log('   Analyst: analyst@upifraud.com / analyst123');
  console.log('   Users:   <name>@email.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
