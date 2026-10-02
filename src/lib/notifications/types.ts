export type NotificationType = 
  | 'NEW_DONATION'
  | 'OCR_MISMATCH'
  | 'BANK_TRANSACTION_UNMATCHED'
  | 'PAYU_PAYMENT_SUCCESS'
  | 'PAYMENT_AMOUNT_MISMATCH'
  | 'DUPLICATE_UTR';

export type NotificationPriority = 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';

export interface CreateNotificationParams {
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  recipientRole?: string | null;
  recipientUserId?: string | null;
  donationId?: string | null;
  bankTransactionId?: string | null;
  paymentGatewayTransactionId?: string | null;
  idempotencyKey?: string;
}
