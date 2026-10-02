import prisma from '@/lib/prisma';
import { DashboardSummary, PayUSummary, ReconciliationSummary, ReportFilters } from './types';
import { buildDonationQuery } from './filters';

export async function getDashboardSummary(filters: ReportFilters = {}): Promise<DashboardSummary> {
  const where = buildDonationQuery(filters);
  
  const stats = await prisma.donation.groupBy({
    by: ['status'],
    where,
    _count: { _all: true },
    _sum: { amount: true },
  });

  const summary: DashboardSummary = {
    totalDonations: 0,
    verifiedDonations: 0,
    pendingDonations: 0,
    needsManualReview: 0,
    rejectedDonations: 0,
    duplicateDonations: 0,
    totalVerifiedAmount: 0,
    totalPendingAmount: 0,
  };

  for (const stat of stats) {
    const count = stat._count._all;
    const amount = stat._sum.amount || 0;
    
    summary.totalDonations += count;
    
    switch (stat.status) {
      case 'VERIFIED':
        summary.verifiedDonations += count;
        summary.totalVerifiedAmount += amount;
        break;
      case 'PENDING':
        summary.pendingDonations += count;
        summary.totalPendingAmount += amount;
        break;
      case 'NEEDS_MANUAL_REVIEW':
        summary.needsManualReview += count;
        break;
      case 'REJECTED':
        summary.rejectedDonations += count;
        break;
      case 'DUPLICATE':
        summary.duplicateDonations += count;
        break;
    }
  }

  return summary;
}

export async function getPaymentMethodSummary(filters: ReportFilters = {}) {
  const where = buildDonationQuery(filters);
  
  const stats = await prisma.donation.groupBy({
    by: ['paymentMethod'],
    where,
    _count: { _all: true },
    _sum: { amount: true },
  });

  return stats.map(s => ({
    method: s.paymentMethod,
    count: s._count._all,
    amount: s._sum.amount || 0
  }));
}

export async function getBankReconciliationSummary(): Promise<ReconciliationSummary> {
  const stats = await prisma.bankTransaction.groupBy({
    by: ['isReconciled'],
    _count: { _all: true },
    _sum: { credit: true, debit: true }
  });

  const summary: ReconciliationSummary = {
    totalBankTransactions: 0,
    totalBankCredits: 0,
    totalBankDebits: 0,
    matchedTransactions: 0,
    unmatchedCredits: 0,
    duplicateTransactions: 0,
    transactionsRequiringReview: 0,
    reconciledAmount: 0,
    unreconciledCreditAmount: 0,
  };

  for (const stat of stats) {
    const count = stat._count?._all || 0;
    const credit = stat._sum?.credit || 0;
    const debit = stat._sum?.debit || 0;

    summary.totalBankTransactions += count;
    summary.totalBankCredits += credit;
    summary.totalBankDebits += debit;

    if (stat.isReconciled) {
      summary.matchedTransactions += count;
      summary.reconciledAmount += credit;
    } else {
      if (credit > 0) {
        summary.unmatchedCredits += count;
        summary.unreconciledCreditAmount += credit;
      }
    }
  }

  return summary;
}

export async function getPayUSummary(): Promise<PayUSummary> {
  const totalTransactions = await prisma.paymentGatewayTransaction.count({ where: { provider: 'PAYU' } });
  
  const stats = await prisma.paymentGatewayTransaction.groupBy({
    by: ['status'],
    where: { provider: 'PAYU' },
    _count: { _all: true },
    _sum: { amount: true }
  });

  const summary: PayUSummary = {
    totalTransactions,
    successfulPayments: 0,
    failedPayments: 0,
    pendingPayments: 0,
    duplicateCallbacks: 0, // Inferred later or by tracking duplicates
    amountMismatches: 0, // Complex to aggregate simply, can be inferred from unlinked success
    linkedToDonations: await prisma.paymentGatewayTransaction.count({ where: { provider: 'PAYU', paymentTransaction: { isNot: null } } }),
    unlinkedTransactions: await prisma.paymentGatewayTransaction.count({ where: { provider: 'PAYU', paymentTransaction: null } }),
    totalSuccessfulAmount: 0,
  };

  for (const stat of stats) {
    const count = stat._count._all;
    const amount = stat._sum.amount || 0;

    if (stat.status.toLowerCase() === 'success') {
      summary.successfulPayments += count;
      summary.totalSuccessfulAmount += amount;
    } else if (stat.status.toLowerCase() === 'failure') {
      summary.failedPayments += count;
    } else {
      summary.pendingPayments += count;
    }
  }

  return summary;
}
