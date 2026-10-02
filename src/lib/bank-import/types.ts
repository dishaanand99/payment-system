export type ColumnMapping = {
  date: string;
  description: string;
  reference: string;
  credit: string;
  debit: string;
  balance: string;
};

export type ParsedRow = Record<string, unknown>;

export type NormalizedBankTransaction = {
  date: Date | null;
  description: string;
  referenceNumber: string | null;
  credit: number | null;
  debit: number | null;
  balance: number | null;
  isCredit: boolean;
  isValid: boolean;
  validationError?: string;
  originalRow: Record<string, unknown>;
};

export type ImportPreview = {
  filename: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  creditCount: number;
  debitCount: number;
  rows: NormalizedBankTransaction[];
  duplicateCount: number;
  potentialMatchesCount: number;
};
