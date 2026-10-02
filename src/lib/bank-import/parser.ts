import Papa from 'papaparse';
import * as xlsx from 'xlsx';
import { ParsedRow } from './types';

export function parseCsv(buffer: Buffer): { data: ParsedRow[], headers: string[] } {
  const content = buffer.toString('utf-8');
  const result = Papa.parse(content, { header: true, skipEmptyLines: true });
  return {
    data: result.data as ParsedRow[],
    headers: result.meta.fields || []
  };
}

export function parseExcel(buffer: Buffer): { data: ParsedRow[], headers: string[] } {
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  const data = xlsx.utils.sheet_to_json(worksheet, { defval: '' }) as ParsedRow[];
  const headers = data.length > 0 ? Object.keys(data[0]) : [];
  
  return { data, headers };
}

export function parseStatement(buffer: Buffer, mimeType: string, filename: string): { data: ParsedRow[], headers: string[] } {
  if (filename.toLowerCase().endsWith('.csv') || mimeType === 'text/csv') {
    return parseCsv(buffer);
  } else if (filename.toLowerCase().endsWith('.xlsx') || filename.toLowerCase().endsWith('.xls') || mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
    return parseExcel(buffer);
  } else {
    throw new Error('Unsupported file format. Please upload CSV or Excel files.');
  }
}
