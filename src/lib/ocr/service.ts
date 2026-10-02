import { OCRProvider } from './types';
import { TesseractProvider } from './providers/tesseract';
import { parseOCRText } from './parser';
import prisma from '@/lib/prisma';
import fs from 'fs';
import { NotificationService } from '@/lib/notifications';

export class OCRService {
  private provider: OCRProvider;

  constructor(provider?: OCRProvider) {
    this.provider = provider || new TesseractProvider();
  }

  async processDonationScreenshot(donationId: string, adminId: string): Promise<any> {
    const donation = await prisma.donation.findUnique({
      where: { id: donationId },
      include: { ocrResults: true }
    });

    if (!donation || !donation.paymentScreenshotPath) {
      throw new Error('Donation or screenshot not found.');
    }

    if (!fs.existsSync(donation.paymentScreenshotPath)) {
      throw new Error('Screenshot file not found on disk.');
    }
    
    try {
      await prisma.auditLog.create({
        data: {
          userId: adminId,
          action: 'OCR_PROCESSING_STARTED',
          entityType: 'Donation',
          entityId: donationId,
        }
      });

      const ocrOutput = await this.provider.extractText(donation.paymentScreenshotPath);
      const parsedData = parseOCRText(ocrOutput.rawText);

      // Simple heuristic for status
      let status = 'PARTIAL';
      if (parsedData.extractedAmount && parsedData.extractedUtr) {
        status = 'SUCCESS';
      }

      const ocrResult = await prisma.oCRResult.create({
        data: {
          donationId,
          imageUrl: donation.paymentScreenshotPath,
          rawText: ocrOutput.rawText,
          confidenceScore: ocrOutput.confidenceScore,
          status,
          extractedUtr: parsedData.extractedUtr,
          extractedAmount: parsedData.extractedAmount,
          extractedDate: parsedData.extractedDate,
          extractedTime: parsedData.extractedTime,
          extractedDonorName: parsedData.extractedDonorName,
          extractedPaymentMethod: parsedData.extractedPaymentMethod,
          extractedBankName: parsedData.extractedBankName,
          extractedPaymentStatus: parsedData.extractedPaymentStatus,
        }
      });

      await prisma.auditLog.create({
        data: {
          userId: adminId,
          action: 'OCR_PROCESSING_COMPLETED',
          entityType: 'Donation',
          entityId: donationId,
        }
      });

      // Check for mismatches
      const hasMismatch = (parsedData.extractedAmount && parsedData.extractedAmount !== donation.amount) ||
                          (parsedData.extractedUtr && donation.utr && parsedData.extractedUtr !== donation.utr);
                          
      if (hasMismatch) {
        const notifService = new NotificationService();
        await notifService.triggerOcrMismatch(donationId, donation.receiptNumber || donationId);
      }

      return {
        success: true,
        ocrResult
      };

    } catch (error) {
       await prisma.auditLog.create({
        data: {
          userId: adminId,
          action: 'OCR_PROCESSING_FAILED',
          entityType: 'Donation',
          entityId: donationId,
        }
      });
      
      const failedResult = await prisma.oCRResult.create({
          data: {
              donationId,
              imageUrl: donation.paymentScreenshotPath,
              status: 'FAILED'
          }
      });

      return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown OCR error',
          ocrResult: failedResult
      }
    }
  }
}
