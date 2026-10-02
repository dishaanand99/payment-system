import { Prisma } from '@prisma/client';
import { ReportFilters } from './types';

export function buildDonationQuery(filters: ReportFilters): Prisma.DonationWhereInput {
  const where: Prisma.DonationWhereInput = {};

  if (filters.dateFrom || filters.dateTo) {
    where.donatedAt = {};
    if (filters.dateFrom) {
      where.donatedAt.gte = new Date(filters.dateFrom + 'T00:00:00.000Z');
    }
    if (filters.dateTo) {
      where.donatedAt.lte = new Date(filters.dateTo + 'T23:59:59.999Z');
    }
  }

  if (filters.status && filters.status !== 'ALL') {
    where.status = filters.status;
  }

  if (filters.paymentMethod && filters.paymentMethod !== 'ALL') {
    if (filters.paymentMethod === 'OTHER') {
      where.paymentMethod = { notIn: ['UPI', 'BANK_TRANSFER', 'PAYU'] };
    } else {
      where.paymentMethod = filters.paymentMethod;
    }
  }

  // Trusted source is tracked in verified attempts (latest one) or we can just filter by having a transaction with that source
  if (filters.trustedSource && filters.trustedSource !== 'ALL') {
    if (filters.trustedSource === 'NONE') {
      where.transactions = { none: {} };
    } else if (filters.trustedSource === 'MANUAL') {
      where.verificationAttempts = { some: { source: 'MANUAL', resultStatus: 'VERIFIED' } };
    } else {
      where.transactions = { some: { source: filters.trustedSource } };
    }
  }

  if (filters.donorName) {
    where.donorName = { contains: filters.donorName };
  }

  if (filters.utr) {
    // Search in donation.utr or any linked transaction utr
    where.OR = [
      { utr: { contains: filters.utr } },
      { transactions: { some: { utr: { contains: filters.utr } } } }
    ];
  }

  return where;
}
