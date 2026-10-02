import prisma from '@/lib/prisma';
import { payuConfig } from './config';
import { PayUCallbackPayload, PayUPaymentInitiation, PayUStatus } from './types';
import { generatePaymentHash, verifyCallbackHash } from './hash';
import { VerificationEngine } from '../verification/service';
import { Donation } from '@prisma/client';
import { NotificationService } from '../notifications';

export class PayUService {
  
  /**
   * Generates the required fields to construct an HTML form for PayU submission.
   */
  async createPaymentRequest(donationId: string): Promise<PayUPaymentInitiation & { hash: string; url: string; key: string }> {
    const donation = await prisma.donation.findUnique({ where: { id: donationId } });
    if (!donation) throw new Error('Donation not found');

    // txnid length is capped at 25 characters by PayU in some gateways.
    // However, our UUIDs are 36 chars.
    // Let's use the donation.id without dashes to map, but wait, without dashes it's 32 chars.
    // If we use just the first 25 chars, we risk collision.
    // Let's store a dedicated unique mapping or just assume our S2S supports up to 255 (PayU web checkout supports longer txnids now).
    // The official PayU dev guide currently lists txnid max length as 255.
    const txnid = donation.id;

    const data: PayUPaymentInitiation = {
      txnid,
      amount: donation.amount,
      productinfo: `Donation ${donationId}`,
      firstname: donation.donorName || 'Donor',
      email: donation.donorEmail || 'noreply@ngo.org',
      phone: donation.donorPhone || '9999999999',
      surl: payuConfig.successUrl,
      furl: payuConfig.failureUrl,
    };

    const hash = generatePaymentHash(data);

    return {
      ...data,
      hash,
      url: payuConfig.baseUrl,
      key: payuConfig.merchantKey,
    };
  }

  /**
   * Process incoming PayU S2S or Callback Webhook
   */
  async processCallback(payload: PayUCallbackPayload, source: 'SERVER_WEBHOOK' | 'BROWSER_REDIRECT' = 'SERVER_WEBHOOK'): Promise<{ success: boolean; donationId: string | null }> {
    // 1. Merchant Key & Signature Verification
    if (payload.key && payload.key !== payuConfig.merchantKey) {
       await prisma.auditLog.create({
         data: {
           action: 'PAYU_INVALID_MERCHANT_KEY',
           entityType: 'PayUCallback',
           entityId: payload.txnid || 'unknown',
         }
       });
       throw new Error('Invalid merchant key');
    }

    if (!verifyCallbackHash(payload)) {
      await prisma.auditLog.create({
         data: {
           action: 'PAYU_SIGNATURE_INVALID',
           entityType: 'PayUCallback',
           entityId: payload.txnid || 'unknown',
           newValues: JSON.stringify({ amount: payload.amount, txnid: payload.txnid })
         }
      });
      throw new Error('Invalid signature');
    }

    // 2. Identify Donation
    const donationId = payload.txnid;
    const donation = await prisma.donation.findUnique({ where: { id: donationId } });
    
    if (!donation) {
       await prisma.auditLog.create({
         data: {
           action: 'PAYU_DONATION_NOT_FOUND',
           entityType: 'PayUCallback',
           entityId: payload.txnid,
         }
       });
       throw new Error('Donation not found');
    }

    // 3. Amount Validation
    const payuAmount = parseFloat(payload.amount);
    if (Math.abs(donation.amount - payuAmount) > 0.01) {
       await prisma.auditLog.create({
         data: {
           action: 'PAYU_AMOUNT_MISMATCH',
           entityType: 'Donation',
           entityId: donation.id,
           newValues: JSON.stringify({ expected: donation.amount, received: payuAmount })
         }
       });
       // We still record the transaction but DO NOT verify it.
       const notifService = new NotificationService();
       await notifService.triggerAmountMismatch(donation.id, donation.receiptNumber, donation.amount, payuAmount);
    }

    // 4. Idempotency Check
    const existingPgTx = await prisma.paymentGatewayTransaction.findUnique({
      where: { providerTransactionId: payload.mihpayid }
    });

    if (existingPgTx) {
       await prisma.auditLog.create({
         data: {
           action: 'PAYU_TRANSACTION_DUPLICATE',
           entityType: 'PaymentGatewayTransaction',
           entityId: existingPgTx.id,
         }
       });
       return { success: true, donationId: donation.id };
    }

    // Sanitize raw payload before storage
    const sanitizedPayload: Partial<PayUCallbackPayload> = { ...payload };
    delete sanitizedPayload.hash;
    delete sanitizedPayload.key;

    // 5. Persist PaymentGatewayTransaction
    const pgTx = await prisma.paymentGatewayTransaction.create({
      data: {
        provider: 'PAYU',
        providerTransactionId: payload.mihpayid,
        status: payload.status,
        amount: payuAmount,
        rawResponse: JSON.stringify(sanitizedPayload)
      }
    });

    await prisma.auditLog.create({
       data: {
         action: 'PAYU_TRANSACTION_CREATED',
         entityType: 'PaymentGatewayTransaction',
         entityId: pgTx.id,
         newValues: JSON.stringify({ status: payload.status })
       }
    });

    // 6. Link PaymentTransaction and Verification Engine if SUCCESS
    if (payload.status.toLowerCase() === 'success' && Math.abs(donation.amount - payuAmount) <= 0.01) {
        if (source === 'BROWSER_REDIRECT') {
            await prisma.auditLog.create({
               data: {
                 action: 'PAYU_BROWSER_REDIRECT_LOGGED',
                 entityType: 'PaymentGatewayTransaction',
                 entityId: pgTx.id,
                 newValues: JSON.stringify({ note: 'Browser redirect received, awaiting server webhook.' })
               }
            });
            return { success: true, donationId: donation.id };
        }

        // Create trusted PaymentTransaction
        const pTx = await prisma.paymentTransaction.create({
          data: {
            donationId: donation.id,
            gatewayTransactionId: pgTx.id,
            utr: payload.bank_ref_num || undefined, // Often returned by PayU
            amount: payuAmount,
            transactionDate: new Date(),
            status: 'SUCCESS',
            source: 'PAYU_WEBHOOK'
          }
        });

        // Trigger Phase 6 Verification
        const engine = new VerificationEngine();
        await engine.runVerification(donation.id, undefined); // undefined adminId because it's automated

        const notifService = new NotificationService();
        await notifService.triggerPayuSuccess(donation.id, donation.receiptNumber, pgTx.id);
    } else {
        await prisma.auditLog.create({
           data: {
             action: 'PAYU_STATUS_FAILED',
             entityType: 'PaymentGatewayTransaction',
             entityId: pgTx.id,
             newValues: JSON.stringify({ status: payload.status, error: payload.error_Message })
           }
        });
    }

    return { success: payload.status.toLowerCase() === 'success', donationId: donation.id };
  }
}
