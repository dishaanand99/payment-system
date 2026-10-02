import { ExtractedData } from './types';

export function parseOCRText(text: string): ExtractedData {
  const result: ExtractedData = {
    extractedUtr: null,
    extractedAmount: null,
    extractedDate: null,
    extractedTime: null,
    extractedDonorName: null,
    extractedPaymentMethod: null,
    extractedBankName: null,
    extractedPaymentStatus: null,
  };

  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const fullText = text.replace(/\n/g, ' ');

  // Amount parsing
  const amountRegex = /(?:₹|Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?)/i;
  const amountMatch = fullText.match(amountRegex);
  if (amountMatch && amountMatch[1]) {
    const rawAmount = amountMatch[1].replace(/,/g, '');
    const numAmount = parseFloat(rawAmount);
    if (!isNaN(numAmount)) {
      result.extractedAmount = numAmount;
    }
  }

  // UTR / Transaction ID parsing
  const utrRegex = /(?:UPI Ref No|UPI Transaction ID|UTR|Transaction ID|Txn ID|Reference No|RRN)[:\-\s]*([A-Z0-9]{10,22})/i;
  const utrMatch = fullText.match(utrRegex);
  if (utrMatch && utrMatch[1]) {
    result.extractedUtr = utrMatch[1].trim();
  } else {
    // Fallback: look for exactly 12 digits which is common for UPI UTRs in India
    const fallbackUtrMatch = fullText.match(/\b(\d{12})\b/);
    if (fallbackUtrMatch) {
       result.extractedUtr = fallbackUtrMatch[1];
    }
  }

  // Status parsing
  const statusRegex = /(Success(?:ful)?|Completed|Paid|Payment Successful)/i;
  const statusMatch = fullText.match(statusRegex);
  if (statusMatch) {
    result.extractedPaymentStatus = statusMatch[1].trim();
  } else if (/failed|declined/i.test(fullText)) {
    result.extractedPaymentStatus = 'Failed';
  }

  // Date parsing (e.g. 01/10/2026 or 01 Oct 2026)
  const dateRegex = /(\d{1,2}[\/\s-](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{1,2})[\/\s-]\d{2,4})/i;
  const dateMatch = fullText.match(dateRegex);
  if (dateMatch && dateMatch[1]) {
    const parsedDate = new Date(dateMatch[1]);
    if (!isNaN(parsedDate.getTime())) {
      result.extractedDate = parsedDate;
    }
  }

  // Time parsing (e.g. 02:35 PM, 14:35)
  const timeRegex = /\b((?:[01]?\d|2[0-3]):[0-5]\d\s?(?:AM|PM|am|pm)?)\b/;
  const timeMatch = fullText.match(timeRegex);
  if (timeMatch && timeMatch[1]) {
    result.extractedTime = timeMatch[1].trim();
  }

  // Payment Method and App
  if (/upi/i.test(fullText) || /@ybl|@okaxis|@okhdfcbank|@okicici|@paytm/i.test(fullText)) {
    result.extractedPaymentMethod = 'UPI';
  } else if (/bank transfer|neft|rtgs|imps/i.test(fullText)) {
    result.extractedPaymentMethod = 'BANK_TRANSFER';
  } else if (/card/i.test(fullText)) {
    result.extractedPaymentMethod = 'CARD';
  }

  const appRegex = /(Google Pay|GPay|Paytm|PhonePe|Amazon Pay|Cred)/i;
  const appMatch = fullText.match(appRegex);
  if (appMatch && appMatch[1]) {
    result.extractedBankName = appMatch[1].trim();
  }

  // Donor Name is tricky, just grabbing lines that might look like names
  const nameRegex = /(?:Transferer|Paid by|From|Sent by|Name|UPI payer name)[:\-\s]*([A-Za-z\s]+)/i;
  const nameMatch = fullText.match(nameRegex);
  if (nameMatch && nameMatch[1]) {
     result.extractedDonorName = nameMatch[1].trim();
  }

  return result;
}
