'use server';

import { requireAuth } from '@/lib/auth/session';
import { canVerifyDonation, Role } from '@/lib/auth/permissions';
import { OCRService } from '@/lib/ocr/service';
import { revalidatePath } from 'next/cache';

export async function processDonationOCR(donationId: string) {
  const session = await requireAuth();
  if (!canVerifyDonation(session.role as Role)) {
    throw new Error('Unauthorized');
  }

  const ocrService = new OCRService();
  const result = await ocrService.processDonationScreenshot(donationId, session.userId);

  revalidatePath('/admin/ocr');
  revalidatePath(`/admin/ocr/${donationId}`);
  
  return result;
}
