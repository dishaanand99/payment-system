import { OCRProvider, OCRProviderResult } from '../types';
import Tesseract from 'tesseract.js';
import { readFileSync } from 'fs';

export class TesseractProvider implements OCRProvider {
  async extractText(imagePath: string): Promise<OCRProviderResult> {
    try {
      const imageBuffer = readFileSync(imagePath);
      const { data: { text, confidence } } = await Tesseract.recognize(
        imageBuffer,
        'eng',
      );
      
      return {
        rawText: text,
        confidenceScore: confidence,
      };
    } catch (error) {
      console.error('Tesseract OCR error:', error);
      throw new Error('Failed to run OCR on the image.');
    }
  }
}
