import { Donation, PaymentTransaction } from '@prisma/client';
import { MatchSignal, TrustedSource, VerificationResult } from './types';
import { VERIFICATION_RULES } from './rules';

export function normalizeName(name: string | null | undefined): string {
  if (!name) return '';
  return name.toLowerCase().trim().replace(/[.,]/g, '').replace(/\s+/g, ' ');
}

export function compareNames(donorName: string | null, txName: string | null): MatchSignal {
  if (!donorName || !txName) return 'NOT_AVAILABLE';
  const dName = normalizeName(donorName);
  const tName = normalizeName(txName);
  if (dName === tName || dName.includes(tName) || tName.includes(dName)) return 'MATCH';
  return 'MISMATCH';
}

export function evaluateVerification(
  donation: Donation,
  trustedTx?: PaymentTransaction,
  isUtrDuplicateElsewhere = false
): VerificationResult {
  
  const result: VerificationResult = {
    utrSignal: 'NOT_AVAILABLE',
    amountSignal: 'NOT_AVAILABLE',
    dateSignal: 'NOT_AVAILABLE',
    timeSignal: 'NOT_AVAILABLE',
    paymentMethodSignal: 'NOT_AVAILABLE',
    nameSignal: 'NOT_AVAILABLE',
    trustedSource: 'NONE',
    overallDecision: 'PENDING',
    reason: 'No trusted transaction found.',
  };

  if (isUtrDuplicateElsewhere) {
    result.overallDecision = 'DUPLICATE';
    result.reason = 'UTR is already verified for another donation.';
    return result;
  }

  if (!trustedTx) {
     if (donation.utr) {
       result.overallDecision = 'PENDING';
       result.reason = 'Awaiting trusted transaction for provided UTR.';
     } else {
       result.overallDecision = 'NEEDS_MANUAL_REVIEW';
       result.reason = 'No UTR provided, cannot automatically verify without trusted source mapping.';
     }
     return result;
  }

  result.trustedSource = trustedTx.source as TrustedSource;
  result.matchedTransactionId = trustedTx.id;

  // UTR MATCH
  if (donation.utr && trustedTx.utr) {
    result.utrSignal = (donation.utr === trustedTx.utr) ? 'MATCH' : 'MISMATCH';
  } else {
    result.utrSignal = 'NOT_AVAILABLE';
  }

  // AMOUNT MATCH
  if (donation.amount === trustedTx.amount) {
    result.amountSignal = 'MATCH';
  } else {
    result.amountSignal = 'MISMATCH';
  }

  // DATE MATCH
  if (donation.donatedAt && trustedTx.transactionDate) {
    const timeDiffMs = Math.abs(donation.donatedAt.getTime() - trustedTx.transactionDate.getTime());
    const diffDays = timeDiffMs / (1000 * 60 * 60 * 24);
    if (diffDays <= VERIFICATION_RULES.DATE_TOLERANCE_DAYS) {
      result.dateSignal = 'MATCH';
    } else {
      result.dateSignal = 'MISMATCH';
    }
  }

  // DECISION LOGIC
  if (result.utrSignal === 'MATCH' && result.amountSignal === 'MATCH' && (result.dateSignal === 'MATCH' || result.dateSignal === 'NOT_AVAILABLE')) {
    result.overallDecision = 'VERIFIED';
    result.reason = 'Exact match on UTR and Amount with trusted transaction.';
  } else if (result.amountSignal === 'MISMATCH') {
    result.overallDecision = 'NEEDS_MANUAL_REVIEW';
    result.reason = 'Amount mismatch with trusted transaction.';
  } else if (result.utrSignal === 'MISMATCH') {
    result.overallDecision = 'NEEDS_MANUAL_REVIEW';
    result.reason = 'UTR mismatch with trusted transaction.';
  } else if (result.dateSignal === 'MISMATCH') {
    result.overallDecision = 'NEEDS_MANUAL_REVIEW';
    result.reason = 'Date outside acceptable tolerance.';
  } else if (result.utrSignal === 'NOT_AVAILABLE' && result.amountSignal === 'MATCH' && result.dateSignal === 'MATCH') {
    result.overallDecision = 'NEEDS_MANUAL_REVIEW';
    result.reason = 'Missing UTR but amounts and dates match. Needs manual confirmation.';
  } else {
    result.overallDecision = 'NEEDS_MANUAL_REVIEW';
    result.reason = 'Ambiguous match with trusted transaction.';
  }

  return result;
}
