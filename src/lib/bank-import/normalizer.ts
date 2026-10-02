import { ColumnMapping, NormalizedBankTransaction, ParsedRow } from './types';

export function extractReference(description: string, existingRef: string | null): string | null {
  if (existingRef && existingRef.length > 5) return existingRef.trim();

  // Try to find UTR/UPI ref in description
  // Matches typical Indian UTRs (usually 12 digits for UPI, or alphanumeric for NEFT/IMPS)
  const utrMatch = description.match(/\b([A-Z0-9]{10,22})\b/i);
  if (utrMatch) {
    // Basic filter to avoid matching random short words
    const candidate = utrMatch[1];
    if (candidate.length >= 8 && /\d/.test(candidate)) {
      return candidate.trim();
    }
  }
  return null;
}

export function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  // Handle formats like DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
  const parts = dateStr.split(/[-/]/);
  if (parts.length === 3) {
    let day = 1, month = 0, year = 1970;
    
    if (parts[2].length === 4) {
      // DD/MM/YYYY
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      year = parseInt(parts[2], 10);
    } else if (parts[0].length === 4) {
      // YYYY-MM-DD
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      day = parseInt(parts[2], 10);
    } else if (parts[2].length === 2) {
      // DD/MM/YY
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      year = 2000 + parseInt(parts[2], 10);
    }
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }
  
  const fallback = new Date(dateStr);
  if (!isNaN(fallback.getTime())) return fallback;

  return null;
}

export function parseAmount(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return val;
  const cleaned = String(val).replace(/[^0-9.-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

export function normalizeRow(row: ParsedRow, mapping: ColumnMapping): NormalizedBankTransaction {
  const dateRaw = row[mapping.date] ? String(row[mapping.date]) : '';
  const descRaw = row[mapping.description] ? String(row[mapping.description]) : '';
  const refRaw = row[mapping.reference] ? String(row[mapping.reference]) : '';
  const creditRaw = row[mapping.credit];
  const debitRaw = row[mapping.debit];
  const balRaw = row[mapping.balance];

  const date = parseDate(dateRaw);
  const credit = parseAmount(creditRaw);
  const debit = parseAmount(debitRaw);
  const balance = parseAmount(balRaw);

  const referenceNumber = extractReference(descRaw, refRaw);
  const isCredit = credit !== null && credit > 0;

  let isValid = true;
  let validationError = undefined;

  if (!date) {
    isValid = false;
    validationError = 'Invalid or missing date';
  } else if (!descRaw) {
    isValid = false;
    validationError = 'Missing description';
  } else if (credit === null && debit === null) {
    isValid = false;
    validationError = 'Missing credit/debit amount';
  }

  return {
    date,
    description: descRaw.trim(),
    referenceNumber,
    credit,
    debit,
    balance,
    isCredit,
    isValid,
    validationError,
    originalRow: row
  };
}

export function guessMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {
    date: headers[0] || '',
    description: headers[1] || '',
    reference: headers[2] || '',
    credit: headers[3] || '',
    debit: headers[4] || '',
    balance: headers[5] || ''
  };

  const findHeader = (patterns: RegExp[]) => {
    for (const pattern of patterns) {
      const match = headers.find(h => pattern.test(h));
      if (match) return match;
    }
    return '';
  };

  const d = findHeader([/date/i, /txn date/i, /value date/i]);
  if (d) mapping.date = d;

  const desc = findHeader([/description/i, /narration/i, /particulars/i, /details/i]);
  if (desc) mapping.description = desc;

  const ref = findHeader([/reference/i, /utr/i, /txn id/i]);
  if (ref) mapping.reference = ref;

  const cred = findHeader([/credit/i, /deposit/i]);
  if (cred) mapping.credit = cred;

  const deb = findHeader([/debit/i, /withdrawal/i]);
  if (deb) mapping.debit = deb;

  const bal = findHeader([/balance/i]);
  if (bal) mapping.balance = bal;

  return mapping;
}
