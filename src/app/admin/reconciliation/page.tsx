"use client";
import React, { useState } from 'react';
import { MOCK_RECONCILIATION } from '@/lib/mock-data';
import { Card, StatusBadge, Button } from '@/components/ui/shared';

export default function BankReconciliationPage() {
  const [dragActive, setDragActive] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bank Reconciliation</h1>
          <p className="text-sm text-gray-500 mt-1">Upload bank statements to automatically match payments.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card className="h-full">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
              <h3 className="font-semibold text-gray-900">Upload Statement</h3>
            </div>
            <div className="p-6 space-y-4">
              <div 
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}`}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => { e.preventDefault(); setDragActive(false); }}
              >
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm font-medium text-gray-700">Drag & drop your file here</p>
                <p className="text-xs text-gray-500 mt-1">Supported: CSV, XLSX (Max 10MB)</p>
                <Button className="mt-4 w-full" onClick={() => alert('Mock file upload')}>Select File</Button>
              </div>
              <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-lg">
                <strong>Note:</strong> Ensure the statement includes UTR/Reference numbers and transaction amounts for accurate matching.
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="h-full">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
              <h3 className="font-semibold text-gray-900">Import History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 font-medium">File Name</th>
                    <th className="px-6 py-3 font-medium">Bank & Account</th>
                    <th className="px-6 py-3 font-medium">Imported At</th>
                    <th className="px-6 py-3 font-medium">Matches</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {MOCK_RECONCILIATION.map(rec => (
                    <tr key={rec.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{rec.file}</td>
                      <td className="px-6 py-4 text-gray-500">{rec.bank} <span className="font-mono">{rec.account}</span></td>
                      <td className="px-6 py-4 text-gray-500">{rec.importedAt}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 items-center">
                          <span className="text-emerald-600 font-medium">{rec.matched}</span>
                          <span className="text-gray-300">/</span>
                          <span className="text-gray-900 font-medium">{rec.rows}</span>
                          {rec.unmatched > 0 && <span className="text-rose-500 text-xs ml-1">({rec.unmatched} un)</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${rec.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-orange-50 text-orange-700 border border-orange-200'}`}>
                          {rec.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
