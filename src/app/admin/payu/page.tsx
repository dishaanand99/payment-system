import React from 'react';
import Link from 'next/link';
import { Card, StatusBadge } from '@/components/ui/shared';
import { requireAuth } from '@/lib/auth/session';
import { Role } from '@/lib/auth/permissions';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';

export default async function PayUTransactionsPage() {
  const session = await requireAuth();
  if (session.role !== 'SUPER_ADMIN' && session.role !== 'ADMIN') {
    redirect('/admin/unauthorized');
  }
  
  const transactions = await prisma.paymentGatewayTransaction.findMany({
    where: { provider: 'PAYU' },
    orderBy: { createdAt: 'desc' },
    include: {
      paymentTransaction: {
        include: {
          donation: true
        }
      }
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">PayU Transactions</h1>
          <p className="text-sm text-gray-500 mt-1">View incoming PayU webhooks and callbacks.</p>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-medium">PayU Txn ID</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Amount</th>
                <th className="px-6 py-3 font-medium">Gateway Status</th>
                <th className="px-6 py-3 font-medium">Reconciliation</th>
                <th className="px-6 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.map(tx => (
                <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-gray-900">{tx.providerTransactionId}</td>
                  <td className="px-6 py-4 text-gray-500">{tx.createdAt.toLocaleString()}</td>
                  <td className="px-6 py-4 font-medium">₹{tx.amount}</td>
                  <td className="px-6 py-4">
                     <span className={`px-2 py-1 text-xs font-semibold rounded-full ${tx.status.toLowerCase() === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        {tx.status.toUpperCase()}
                     </span>
                  </td>
                  <td className="px-6 py-4">
                    {tx.paymentTransaction ? (
                        <div className="flex flex-col items-start gap-1">
                           <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">LINKED</span>
                           <Link href={`/admin/donations/${tx.paymentTransaction.donationId}`} className="text-xs text-blue-600 hover:underline">
                             Donation #{tx.paymentTransaction.donationId.slice(0, 8)}
                           </Link>
                        </div>
                    ) : (
                        <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">UNLINKED</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/admin/payu/${tx.id}`} className="text-blue-600 hover:text-blue-800 text-sm font-medium">View Raw</Link>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500">No PayU transactions received yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
