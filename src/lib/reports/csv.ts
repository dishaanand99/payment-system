import Papa from 'papaparse';
import { DonationWithRelations } from './types';
import { sanitizeCsvField } from './security';

export function generateCSV(donations: DonationWithRelations[]): string {
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
      'Verified At': d.verifiedAt ? d.verifiedAt.toISOString() : 'N/A',
      'Verified By': d.verifiedById || 'SYSTEM'
    };
  });

  return Papa.unparse(donationData);
}
