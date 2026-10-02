export type MatchSignal = 'MATCH' | 'MISMATCH' | 'NOT_AVAILABLE';
export type VerificationDecision = 'VERIFIED' | 'NEEDS_MANUAL_REVIEW' | 'DUPLICATE' | 'PENDING' | 'REJECTED';
export type TrustedSource = 'BANK_STATEMENT' | 'PAYU_WEBHOOK' | 'PAYMENT_PROVIDER' | 'MANUAL' | 'NONE';

export interface VerificationResult {
  utrSignal: MatchSignal;
  amountSignal: MatchSignal;
  dateSignal: MatchSignal;
  timeSignal: MatchSignal;
  paymentMethodSignal: MatchSignal;
  nameSignal: MatchSignal;
  
  trustedSource: TrustedSource;
  matchedTransactionId?: string;
  
  overallDecision: VerificationDecision;
  reason: string;
}
