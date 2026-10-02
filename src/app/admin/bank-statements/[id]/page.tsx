import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/shared';
import { requireAuth } from '@/lib/auth/session';
import { Role } from '@/lib/auth/permissions';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';

export default async function BankStatementDetailPage({ params }: { params: { id: string } }) {
  const session = await requireAuth();
  if (session.role !== 'SUPER_ADMIN' && session.role !== 'ADMIN') {
    redirect('/admin/unauthorized');
  }

  const { id } = await params;

  const imp = await prisma.bankStatementImport.findUnique({
    where: { id },
    include: {
      uploadedBy: true,
      transactions: {
         include: {
            paymentTransaction: true
         },
         orderBy: { date: 'desc' }
      }
    }
  });

  if (!imp) return <div className="p-6">Import not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
             <Link href="/admin/bank-statements" className="text-gray-400 hover:text-gray-600">
               &larr; Back to Statements
             </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Statement: {imp.filename}</h1>
          <p className="text-sm text-gray-500 mt-1">Imported on {imp.importDate.toLocaleString()} by {imp.uploadedBy.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <Card className="p-4 bg-gray-50/50">
           <div className="text-sm text-gray-500">Total Rows Processed</div>
           <div className="text-xl font-bold text-gray-900 mt-1">{imp.transactions.length}</div>
         </Card>
         <Card className="p-4 bg-emerald-50/50 border-emerald-100">
           <div className="text-sm text-emerald-600">Credits</div>
           <div className="text-xl font-bold text-emerald-700 mt-1">{imp.transactions.filter(t => t.credit).length}</div>
         </Card>
         <Card className="p-4 bg-rose-50/50 border-rose-100">
           <div className="text-sm text-rose-600">Debits</div>
           <div className="text-xl font-bold text-rose-700 mt-1">{imp.transactions.filter(t => t.debit).length}</div>
         </Card>
         <Card className="p-4 bg-blue-50/50 border-blue-100">
           <div className="text-sm text-blue-600">Reconciled</div>
           <div className="text-xl font-bold text-blue-700 mt-1">{imp.transactions.filter(t => t.isReconciled).length}</div>
         </Card>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Description</th>
                <th className="px-6 py-3 font-medium">Ref/UTR</th>
                <th className="px-6 py-3 font-medium text-right">Credit</th>
                <th className="px-6 py-3 font-medium text-right">Debit</th>
                <th className="px-6 py-3 font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {imp.transactions.map(tx => (
                <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-3 font-medium text-gray-900">{tx.date.toISOString().split('T')[0]}</td>
                  <td className="px-6 py-3 max-w-xs truncate text-xs" title={tx.description}>{tx.description}</td>
                  <td className="px-6 py-3 font-mono text-xs text-gray-600">{tx.referenceNumber || '-'}</td>
                  <td className="px-6 py-3 text-right font-semibold text-emerald-600">{tx.credit ? `₹${tx.credit}` : '-'}</td>
                  <td className="px-6 py-3 text-right text-gray-500">{tx.debit ? `₹${tx.debit}` : '-'}</td>
                  <td className="px-6 py-3 text-center">
                    {tx.isReconciled ? (
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">RECONCILED</span>
                            {tx.paymentTransaction && (
                                <Link href={`/admin/verification/${tx.paymentTransaction.donationId}`} className="text-[10px] text-blue-600 hover:underline mt-1">View Donation</Link>
                            )}
                        </div>
                    ) : tx.credit ? (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">UNMATCHED</span>
                    ) : (
                        <span className="text-[10px] text-gray-400 font-medium">N/A</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
