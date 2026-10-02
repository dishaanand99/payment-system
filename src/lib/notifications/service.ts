import { NotificationRepository } from './repository';


export class NotificationService {
  private repo = new NotificationRepository();

  async triggerNewDonation(donationId: string, amount: number, method: string | null) {
    const key = `NEW_DONATION_${donationId}`;
    await this.repo.create({
      type: 'NEW_DONATION',
      title: 'New Donation Received',
      message: `New donation of ₹${amount} received via ${method || 'Unknown'} and awaiting verification.`,
      priority: 'INFO',
      recipientRole: 'ADMIN',
      donationId,
      idempotencyKey: key
    });
  }

  async triggerOcrMismatch(donationId: string, reference: string | null) {
    const key = `OCR_MISMATCH_${donationId}`;
    await this.repo.create({
      type: 'OCR_MISMATCH',
      title: 'OCR Mismatch Detected',
      message: `Payment evidence for donation ${reference || donationId} requires review.`,
      priority: 'WARNING',
      recipientRole: 'VERIFIER',
      donationId,
      idempotencyKey: key
    });
  }

  async triggerBankUnmatched(bankTransactionId: string, amount: number, date: Date, reference: string | null, bankName: string | null) {
    const key = `BANK_UNMATCHED_${bankTransactionId}`;
    const dateStr = date.toLocaleDateString('en-IN');
    const bankStr = bankName ? ` at ${bankName}` : '';
    await this.repo.create({
      type: 'BANK_TRANSACTION_UNMATCHED',
      title: 'Unmatched Bank Transaction',
      message: `Unmatched transaction of ₹${amount} on ${dateStr}${bankStr}. Ref: ${reference || 'N/A'}.`,
      priority: 'WARNING',
      recipientRole: 'VERIFIER',
      bankTransactionId,
      idempotencyKey: key
    });
  }

  async triggerPayuSuccess(donationId: string, reference: string | null, gatewayTransactionId: string) {
    const key = `PAYU_SUCCESS_${gatewayTransactionId}`;
    await this.repo.create({
      type: 'PAYU_PAYMENT_SUCCESS',
      title: 'PayU Payment Successful',
      message: `PayU payment for donation ${reference || donationId} has been received and is ready for verification.`,
      priority: 'INFO',
      recipientRole: 'VERIFIER',
      donationId,
      paymentGatewayTransactionId: gatewayTransactionId,
      idempotencyKey: key
    });
  }

  async triggerAmountMismatch(donationId: string, reference: string | null, expectedAmount: number, actualAmount: number) {
    const key = `AMOUNT_MISMATCH_${donationId}_${actualAmount}`;
    await this.repo.create({
      type: 'PAYMENT_AMOUNT_MISMATCH',
      title: 'Payment Amount Mismatch',
      message: `Trusted payment amount (₹${actualAmount}) does not match the donation amount (₹${expectedAmount}) for ${reference || donationId}. Manual review required.`,
      priority: 'HIGH',
      recipientRole: 'ADMIN',
      donationId,
      idempotencyKey: key
    });
  }

  async triggerDuplicateUtr(donationId: string, utr: string) {
    // Adding timestamp block so if duplicate UTR happens across multiple donations over time, we get separate alerts. 
    // We will just tie it to the donationId where it was detected.
    const key = `DUPLICATE_UTR_${donationId}_${utr}`;
    await this.repo.create({
      type: 'DUPLICATE_UTR',
      title: 'Duplicate UTR Detected',
      message: `Duplicate transaction reference (${utr}) detected. Manual review required.`,
      priority: 'CRITICAL',
      recipientRole: 'SUPER_ADMIN',
      donationId,
      idempotencyKey: key
    });
  }

  // General retrieval
  async getUserNotifications(userId: string, role: string, skip?: number, take?: number) {
    return this.repo.findForUser(userId, role, skip, take);
  }

  async getUnreadCount(userId: string, role: string) {
    return this.repo.countUnreadForUser(userId, role);
  }

  async markAsRead(notificationId: string, userId: string, role: string) {
    return this.repo.markAsRead(notificationId, userId, role);
  }

  async markAllAsRead(userId: string, role: string) {
    return this.repo.markAllAsRead(userId, role);
  }
}
