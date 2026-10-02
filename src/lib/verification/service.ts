import prisma from '@/lib/prisma';
import { PaymentTransaction } from '@prisma/client';
import { evaluateVerification } from './matcher';
import { VerificationDecision, VerificationResult } from './types';
import { NotificationService } from '../notifications';

export class VerificationEngine {
  async runVerification(donationId: string, verifierId?: string): Promise<VerificationResult> {
    const donation = await prisma.donation.findUnique({
      where: { id: donationId },
      include: {
        transactions: true,
      }
    });

    if (!donation) {
      throw new Error('Donation not found');
    }

    // Determine duplicate UTR if any
    let isDuplicate = false;
    if (donation.utr) {
      const existingVerified = await prisma.donation.findFirst({
        where: {
          utr: donation.utr,
          status: 'VERIFIED',
          id: { not: donation.id }
        }
      });
      if (existingVerified) {
        isDuplicate = true;
        
        const notifService = new NotificationService();
        await notifService.triggerDuplicateUtr(donation.id, donation.utr);
      }
    }

    // Find trusted transactions
    // In a real system we might search unlinked PaymentTransactions by UTR.
    // For Phase 6 mock, we'll assume they are already linked if they exist, or we can search by UTR.
    let trustedTx: PaymentTransaction | undefined | null = donation.transactions[0]; // If already linked
    
    if (!trustedTx && donation.utr) {
       trustedTx = await prisma.paymentTransaction.findFirst({
         where: { utr: donation.utr }
       }) as PaymentTransaction | undefined;
    }

    const result = evaluateVerification(donation, trustedTx || undefined, isDuplicate);

    // Save VerificationAttempt
    await prisma.verificationAttempt.create({
      data: {
        donationId: donation.id,
        verifierId: verifierId || null,
        source: result.trustedSource,
        resultStatus: result.overallDecision,
        notes: JSON.stringify({ reason: result.reason, signals: result }),
      }
    });

    // Update Donation if not a terminal manual state that shouldn't be overridden by automated job
    if (donation.status !== 'VERIFIED' || result.overallDecision === 'DUPLICATE') {
        if (result.overallDecision !== 'PENDING') {
            await prisma.donation.update({
                where: { id: donation.id },
                data: {
                    status: result.overallDecision,
                    verifiedById: result.overallDecision === 'VERIFIED' ? verifierId : undefined,
                    verifiedAt: result.overallDecision === 'VERIFIED' ? new Date() : undefined,
                }
            });
            
            // Audit Log
            await prisma.auditLog.create({
                data: {
                    userId: verifierId || null,
                    action: 'VERIFICATION_COMPLETED',
                    entityType: 'Donation',
                    entityId: donation.id,
                    newValues: JSON.stringify({ status: result.overallDecision }),
                }
            });
        }
    }

    return result;
  }

  async manualVerification(donationId: string, verifierId: string, decision: VerificationDecision, reason: string) {
    const donation = await prisma.donation.findUnique({
       where: { id: donationId }
    });
    if (!donation) throw new Error('Donation not found');

    await prisma.verificationAttempt.create({
       data: {
         donationId: donationId,
         verifierId: verifierId,
         source: 'MANUAL',
         resultStatus: decision,
         notes: reason,
       }
    });

    await prisma.donation.update({
       where: { id: donationId },
       data: {
         status: decision,
         verifiedById: decision === 'VERIFIED' ? verifierId : undefined,
         verifiedAt: decision === 'VERIFIED' ? new Date() : undefined,
       }
    });

    await prisma.auditLog.create({
        data: {
            userId: verifierId,
            action: 'MANUAL_VERIFICATION',
            entityType: 'Donation',
            entityId: donationId,
            newValues: JSON.stringify({ status: decision, reason }),
        }
    });

    return { success: true, decision };
  }
}
