'use server';

import { requireAuth } from '@/lib/auth/session';
import { canVerifyDonation, Role } from '@/lib/auth/permissions';
import { VerificationEngine } from '@/lib/verification/service';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { VerificationDecision } from '@/lib/verification/types';

export async function runAutoVerification(donationId: string) {
  const session = await requireAuth();
  if (!canVerifyDonation(session.role as Role)) {
    throw new Error('Unauthorized');
  }

  const engine = new VerificationEngine();
  const result = await engine.runVerification(donationId, session.userId);

  revalidatePath('/admin/verification');
  revalidatePath(`/admin/verification/${donationId}`);
  
  return result;
}

export async function manualVerifyDecision(donationId: string, decision: VerificationDecision, reason: string) {
  const session = await requireAuth();
  if (!canVerifyDonation(session.role as Role)) {
    throw new Error('Unauthorized');
  }

  const engine = new VerificationEngine();
  await engine.manualVerification(donationId, session.userId, decision, reason);

  revalidatePath('/admin/verification');
  revalidatePath(`/admin/verification/${donationId}`);
  
  return { success: true };
}

// Development Only: Mock Trusted Transaction Generator
export async function seedMockTrustedTransaction(donationId: string, mockData: { utr: string, amount: number, date: string }) {
  const session = await requireAuth();
  if (!canVerifyDonation(session.role as Role)) {
    throw new Error('Unauthorized');
  }
  
  // Removed unused bankTx creation

  const paymentTx = await prisma.paymentTransaction.create({
      data: {
          donationId,
          utr: mockData.utr,
          amount: mockData.amount,
          transactionDate: mockData.date ? new Date(mockData.date) : new Date(),
          status: 'SUCCESS',
          source: 'BANK_STATEMENT',
      }
  });
  
  revalidatePath(`/admin/verification/${donationId}`);
  return paymentTx;
}
