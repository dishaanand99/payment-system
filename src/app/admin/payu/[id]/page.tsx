import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/shared';
import { requireAuth } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';

export default async function PayUTransactionDetailPage({ params }: { params: { id: string } }) {
  const session = await requireAuth();
  if (session.role !== 'SUPER_ADMIN' && session.role !== 'ADMIN') {
    redirect('/admin/unauthorized');
  }

  const { id } = await params;

  const tx = await prisma.paymentGatewayTransaction.findUnique({
    where: { id },
    include: {
      paymentTransaction: {
        include: {
          donation: true
        }
      }
    }
  });

  if (!tx) return <div className="p-6">Transaction not found</div>;

  let parsedRaw = null;
  try {
      parsedRaw = tx.rawResponse ? JSON.parse(tx.rawResponse) : null;
  } catch {
      // Ignored
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
         <Link href="/admin/payu" className="text-gray-400 hover:text-gray-600">
           &larr; Back to PayU Transactions
         </Link>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Transaction: {tx.providerTransactionId}</h1>
          <p className="text-sm text-gray-500 mt-1">Received at {tx.createdAt.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <Card className="p-6">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Core Information</h2>
            <div className="space-y-4">
               <div>
                  <div className="text-xs text-gray-500">Gateway Status</div>
                  <div className={`mt-1 font-semibold ${tx.status.toLowerCase() === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {tx.status.toUpperCase()}
                  </div>
               </div>
               <div>
                  <div className="text-xs text-gray-500">Amount</div>
                  <div className="mt-1 font-semibold text-gray-900">₹{tx.amount}</div>
               </div>
               <div>
                  <div className="text-xs text-gray-500">Internal Reference (Donation Link)</div>
                  {tx.paymentTransaction ? (
                      <div className="mt-1">
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded mr-2">LINKED</span>
                          <Link href={`/admin/donations/${tx.paymentTransaction.donationId}`} className="text-sm text-blue-600 hover:underline font-medium">
                            Donation #{tx.paymentTransaction.donationId}
                          </Link>
                      </div>
                  ) : (
                      <div className="mt-1">
                          <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">UNLINKED</span>
                          <span className="text-sm text-gray-500 ml-2">No matching donation verified.</span>
                      </div>
                  )}
               </div>
            </div>
         </Card>

         <Card className="p-6">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Raw Callback Data</h2>
            <div className="bg-gray-50 p-4 rounded text-xs font-mono overflow-auto max-h-96">
                {parsedRaw ? (
                    <pre className="text-gray-700">{JSON.stringify(parsedRaw, null, 2)}</pre>
                ) : (
                    <span className="text-gray-400">No raw data available or unable to parse.</span>
                )}
            </div>
            <p className="mt-2 text-xs text-gray-400">Sensitive fields like `hash` and `key` are securely stripped before persistence.</p>
         </Card>
      </div>
    </div>
  );
}
