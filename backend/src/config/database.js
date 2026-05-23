/**
 * Prisma Client Singleton
 *
 * Ensures only ONE PrismaClient instance exists during development
 * (node --watch restarts would otherwise leak connections).
 */

const { PrismaClient } = require('@prisma/client');

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    log: ['error'], // Only log errors in production
  });
} else {
  // In development, reuse the client across hot-reloads
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['warn', 'error'], // Less verbose in dev
      errorFormat: 'pretty',
    });
  }
  prisma = global.__prisma;
}

module.exports = { prisma };
