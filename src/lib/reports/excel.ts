import * as XLSX from 'xlsx';
import { DonationWithRelations } from './types';
import { sanitizeCsvField } from './security';

export function generateExcelWorkbook(
  donations: DonationWithRelations[],
  bankSummary?: any,
  payuSummary?: any
): Buffer {
  const wb = XLSX.utils.book_new();

  // SHEET 1: Donation Report
  const donationData = donations.map(d => {
    const trustedTx = d.transactions[0];
    const ocr = d.ocrResults[0];

    return {
      'Donation ID': d.id,
      'Receipt Number': sanitizeCsvField(d.receiptNumber) || 'N/A',
      'Donor Name': sanitizeCsvField(d.donorName),
      'Amount': d.amount,
      'Currency': 'INR',
      'Donation Date': d.donatedAt ? d.donatedAt.toISOString() : d.createdAt.toISOString(),
      'Payment Method': d.paymentMethod,
      'Donor UTR': sanitizeCsvField(d.utr) || 'N/A',
      'OCR UTR': ocr ? sanitizeCsvField(ocr.extractedUtr) || 'N/A' : 'N/A',
      'Trusted UTR': trustedTx ? sanitizeCsvField(trustedTx.utr) || 'N/A' : 'N/A',
      'Verification Status': d.status,
      'Trusted Source': trustedTx ? trustedTx.source : 'N/A',
      'Bank': trustedTx && trustedTx.source === 'BANK_STATEMENT' ? 'BANK' : 'N/A',
      'Verified At': d.verifiedAt ? d.verifiedAt.toISOString() : 'N/A',
      'Verified By': d.verifiedById || 'SYSTEM'
    };
  });
  const ws1 = XLSX.utils.json_to_sheet(donationData);
  XLSX.utils.book_append_sheet(wb, ws1, 'Donation Report');

  // SHEET 2: Verification Report
  const verificationData = donations.flatMap(d => 
    d.verificationAttempts.map(v => ({
      'Donation ID': d.id,
      'Verification Attempt ID': v.id,
      'Decision': v.resultStatus,
      'Trusted Source': v.source,
      'Reason': sanitizeCsvField((v.notes ? (() => { try { return JSON.parse(v.notes).reason || v.notes; } catch { return v.notes; } })() : 'N/A')),
      'Created At': v.createdAt.toISOString(),
      'Verified By': v.verifierId || 'SYSTEM'
    }))
  );
  if (verificationData.length > 0) {
    const ws2 = XLSX.utils.json_to_sheet(verificationData);
    XLSX.utils.book_append_sheet(wb, ws2, 'Verification Report');
  }

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}
