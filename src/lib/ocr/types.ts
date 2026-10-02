export interface ExtractedData {
  extractedUtr: string | null;
  extractedAmount: number | null;
  extractedDate: Date | null;
  extractedTime: string | null;
  extractedDonorName: string | null;
  extractedPaymentMethod: string | null;
  extractedBankName: string | null;
  extractedPaymentStatus: string | null;
}

export interface OCRProviderResult {
  rawText: string;
  confidenceScore: number | null;
}

export interface OCRProvider {
  extractText(imagePath: string): Promise<OCRProviderResult>;
}
