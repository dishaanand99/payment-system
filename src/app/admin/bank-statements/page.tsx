import React from 'react';
import Link from 'next/link';
import { Card, StatusBadge } from '@/components/ui/shared';
import { requireAuth } from '@/lib/auth/session';
import { Role } from '@/lib/auth/permissions';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { ImportFlow } from './ImportFlow';

export default async function BankStatementsPage() {
  const session = await requireAuth();
  if (session.role !== 'SUPER_ADMIN' && session.role !== 'ADMIN') {
    redirect('/admin/unauthorized');
  }
  
  const imports = await prisma.bankStatementImport.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      uploadedBy: true
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bank Statements</h1>
          <p className="text-sm text-gray-500 mt-1">Upload and reconcile bank statements.</p>
        </div>
      </div>

      <ImportFlow />

      <h2 className="text-lg font-bold text-gray-900 mt-8 mb-2">Import History</h2>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-medium">Filename</th>
                <th className="px-6 py-3 font-medium">Import Date</th>
                <th className="px-6 py-3 font-medium">Uploaded By</th>
                <th className="px-6 py-3 font-medium">Progress (Rows)</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {imports.map(imp => (
                <tr key={imp.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{imp.filename}</td>
                  <td className="px-6 py-4 text-gray-500">{imp.importDate.toLocaleString()}</td>
                  <td className="px-6 py-4 text-gray-500">{imp.uploadedBy.name}</td>
                  <td className="px-6 py-4">
                     <span className="text-emerald-600 font-medium">{imp.processedRows}</span> / {imp.totalRows}
                  </td>
                  <td className="px-6 py-4"><StatusBadge status={imp.status} /></td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/admin/bank-statements/${imp.id}`} className="text-blue-600 hover:text-blue-800 text-sm font-medium">View Rows</Link>
                  </td>
                </tr>
              ))}
              {imports.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500">No bank statements imported yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
