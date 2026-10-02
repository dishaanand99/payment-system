'use client';

import React, { useState } from 'react';
import { Button, Card } from '@/components/ui/shared';
import { uploadBankStatement, confirmBankStatementImport } from './actions';
import { ImportPreview } from '@/lib/bank-import/types';
import { useRouter } from 'next/navigation';

export function ImportFlow() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const router = useRouter();

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await uploadBankStatement(formData);
      setPreview(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!preview) return;
    
    setLoading(true);
    setError('');
    
    try {
      const res = await confirmBankStatementImport(preview.filename, preview.rows);
      alert(`Import completed!\n\nImported: ${res.successCount}\nDuplicates Ignored: ${res.dupCount}\nFailed: ${res.failCount}`);
      setPreview(null);
      setFile(null);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  if (preview) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-bold mb-4">BANK STATEMENT PREVIEW</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
           <div className="bg-gray-50 p-3 rounded">
             <div className="text-xs text-gray-500">File</div>
             <div className="font-medium text-sm truncate" title={preview.filename}>{preview.filename}</div>
           </div>
           <div className="bg-gray-50 p-3 rounded">
             <div className="text-xs text-gray-500">Rows</div>
             <div className="font-medium">{preview.totalRows} ({preview.validRows} Valid, {preview.invalidRows} Invalid)</div>
           </div>
           <div className="bg-emerald-50 p-3 rounded">
             <div className="text-xs text-emerald-600">Credits / Debits</div>
             <div className="font-medium text-emerald-700">{preview.creditCount} / {preview.debitCount}</div>
           </div>
           <div className="bg-blue-50 p-3 rounded">
             <div className="text-xs text-blue-600">Potential Dups/Matches</div>
             <div className="font-medium text-blue-700">{preview.duplicateCount} / {preview.potentialMatchesCount}</div>
           </div>
        </div>

        <div className="flex gap-3">
           <Button variant="secondary" onClick={() => setPreview(null)} disabled={loading}>Cancel</Button>
           <Button variant="primary" onClick={handleConfirm} disabled={loading}>
             {loading ? 'Importing & Reconciling...' : 'Confirm Import'}
           </Button>
        </div>
        
        {error && <div className="mt-4 p-3 bg-red-50 text-red-700 rounded text-sm">{error}</div>}
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-bold mb-4">Import New Statement</h2>
      <form onSubmit={handleUpload} className="flex items-end gap-4">
         <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Select CSV or Excel File</label>
            <input 
              type="file" 
              accept=".csv, .xls, .xlsx, text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border rounded-md"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
            />
         </div>
         <Button variant="primary" type="submit" disabled={!file || loading}>
           {loading ? 'Uploading...' : 'Preview Import'}
         </Button>
      </form>
      {error && <div className="mt-4 p-3 bg-red-50 text-red-700 rounded text-sm">{error}</div>}
      <p className="mt-4 text-xs text-gray-500">Max file size: 10MB. We parse files server-side to protect sensitive data.</p>
    </Card>
  );
}
