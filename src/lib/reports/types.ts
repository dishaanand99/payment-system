import { Prisma } from '@prisma/client';

export interface ReportFilters {
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string;
  status?: string;
  paymentMethod?: string;
  trustedSource?: string;
  bank?: string;
  donorName?: string;
  utr?: string;
}

export interface DashboardSummary {
  totalDonations: number;
  verifiedDonations: number;
  pendingDonations: number;
  needsManualReview: number;
  rejectedDonations: number;
  duplicateDonations: number;
  totalVerifiedAmount: number;
  totalPendingAmount: number;
}

export interface ReconciliationSummary {
  totalBankTransactions: number;
  totalBankCredits: number;
  totalBankDebits: number;
  matchedTransactions: number;
  unmatchedCredits: number;
  duplicateTransactions: number;
  transactionsRequiringReview: number;
  reconciledAmount: number;
  unreconciledCreditAmount: number;
}

export interface PayUSummary {
  totalTransactions: number;
  successfulPayments: number;
  failedPayments: number;
  pendingPayments: number;
  duplicateCallbacks: number;
  amountMismatches: number;
  linkedToDonations: number;
  unlinkedTransactions: number;
  totalSuccessfulAmount: number;
}

export type DonationWithRelations = Prisma.DonationGetPayload<{
  include: {
    transactions: true;
    ocrResults: true;
    verificationAttempts: true;
  }
}>;
