import React from 'react';
import Link from 'next/link';
import { Card, StatusBadge, Button } from '@/components/ui/shared';
import { requireAuth } from '@/lib/auth/session';
import { canVerifyDonation, Role } from '@/lib/auth/permissions';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { AutoVerifyButton } from './ClientButtons';

export default async function VerificationQueuePage() {
  const session = await requireAuth();
  if (!canVerifyDonation(session.role as Role)) {
    redirect('/admin/unauthorized');
  }
  
  const pending = await prisma.donation.findMany({
    where: {
      status: { in: ['PENDING', 'NEEDS_MANUAL_REVIEW'] }
    },
    include: {
      ocrResults: { orderBy: { createdAt: 'desc' }, take: 1 },
      transactions: true,
      verificationAttempts: { orderBy: { createdAt: 'desc' }, take: 1 }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Verification Queue</h1>
          <p className="text-sm text-gray-500 mt-1">Donations waiting for manual or automated verification.</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 text-sm text-amber-800">
        <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <p><strong>Reminder:</strong> OCR is an extraction mechanism only. Final verification must rely on Bank Statement or Payment Gateway matching.</p>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-medium">Donor & UTR</th>
                <th className="px-6 py-3 font-medium">Amount</th>
                <th className="px-6 py-3 font-medium">OCR Status</th>
                <th className="px-6 py-3 font-medium">Trusted Source</th>
                <th className="px-6 py-3 font-medium">Verification Status</th>
                <th className="px-6 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pending.map(don => {
                const ocrResult = don.ocrResults[0];
                const hasTrustedSource = don.transactions.length > 0;
                return (
                  <tr key={don.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{don.donorName || '-'}</div>
                      <div className="text-xs text-gray-500 font-mono mt-0.5">{don.utr || '-'}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">₹{don.amount.toLocaleString()}</td>
                    <td className="px-6 py-4">
                       <StatusBadge status={ocrResult ? ocrResult.status : 'PENDING'} />
                    </td>
                    <td className="px-6 py-4 text-xs">
                       {hasTrustedSource ? <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded">YES</span> : <span className="text-gray-500 bg-gray-50 px-2 py-1 rounded">NO</span>}
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={don.status} /></td>
                    <td className="px-6 py-4 text-right flex gap-2 justify-end">
                      <AutoVerifyButton donationId={don.id} />
                      <Link href={`/admin/verification/${don.id}`} className="text-white bg-blue-600 hover:bg-blue-700 font-medium text-xs px-3 py-1.5 rounded-md transition-colors inline-block">Review</Link>
                    </td>
                  </tr>
                );
              })}
              {pending.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500">No donations pending verification.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
