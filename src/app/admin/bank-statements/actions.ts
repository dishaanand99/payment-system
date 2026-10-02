'use server';

import { requireAuth } from '@/lib/auth/session';
import { Role } from '@/lib/auth/permissions';
import { parseStatement } from '@/lib/bank-import/parser';
import { guessMapping, normalizeRow } from '@/lib/bank-import/normalizer';
import { BankImportService } from '@/lib/bank-import/service';
import { NormalizedBankTransaction, ImportPreview } from '@/lib/bank-import/types';

function canImportBankStatements(role: Role) {
  return role === 'SUPER_ADMIN' || role === 'ADMIN';
}

export async function uploadBankStatement(formData: FormData): Promise<ImportPreview> {
  const session = await requireAuth();
  if (!canImportBankStatements(session.role as Role)) {
    throw new Error('Unauthorized');
  }

  const file = formData.get('file') as File;
  if (!file) throw new Error('No file uploaded');

  if (file.size > 10 * 1024 * 1024) {
    throw new Error('File exceeds 10MB limit');
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  
  const { data, headers } = parseStatement(buffer, file.type, file.name);
  if (data.length === 0) throw new Error('File is empty or could not be parsed');

  const mapping = guessMapping(headers);

  const normalized = data.map(row => normalizeRow(row, mapping));

  const service = new BankImportService();
  const preview = await service.generatePreview(file.name, normalized);

  return preview;
}

export async function confirmBankStatementImport(filename: string, rows: NormalizedBankTransaction[]) {
  const session = await requireAuth();
  if (!canImportBankStatements(session.role as Role)) {
    throw new Error('Unauthorized');
  }

  const service = new BankImportService();
  const result = await service.confirmImport(session.userId, filename, rows);

  return result;
}
