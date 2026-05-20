/**
 * Prisma Client Singleton
 *
 * Ensures only ONE PrismaClient instance exists during development
 * (node --watch restarts would otherwise leak connections).
 */

const { PrismaClient } = require('@prisma/client');

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // In development, reuse the client across hot-reloads
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['query', 'warn', 'error'],
    });
  }
  prisma = global.__prisma;
}

module.exports = { prisma };
