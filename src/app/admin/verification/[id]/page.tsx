import React from 'react';
import Link from 'next/link';
import { Card, StatusBadge } from '@/components/ui/shared';
import { requireAuth } from '@/lib/auth/session';
import { canVerifyDonation, Role } from '@/lib/auth/permissions';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { AutoVerifyButton, ManualDecisionButtons, MockTransactionForm } from '../ClientButtons';
import { compareNames } from '@/lib/verification/matcher';

export default async function VerificationDetailPage({ params }: { params: { id: string } }) {
  const session = await requireAuth();
  if (!canVerifyDonation(session.role as Role)) {
    redirect('/admin/unauthorized');
  }

  const { id } = await params;

  const donation = await prisma.donation.findUnique({
    where: { id },
    include: {
      ocrResults: { orderBy: { createdAt: 'desc' } },
      transactions: true,
      verificationAttempts: { orderBy: { createdAt: 'desc' } }
    }
  });

  if (!donation) {
    return <div className="p-6">Donation not found</div>;
  }

  const ocrResult = donation.ocrResults[0];
  const trustedTx = donation.transactions[0];
  const lastAttempt = donation.verificationAttempts[0];

  const getMatchSignal = (original: unknown, extracted: unknown) => {
    if (!original || !extracted) return 'NOT_AVAILABLE';
    return String(original).toLowerCase() === String(extracted).toLowerCase() ? 'MATCH' : 'MISMATCH';
  };

  const renderSignal = (signal: string) => {
    if (signal === 'MATCH') return <span className="text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-1 rounded">MATCH</span>;
    if (signal === 'MISMATCH') return <span className="text-rose-600 font-bold text-xs bg-rose-50 px-2 py-1 rounded">MISMATCH</span>;
    return <span className="text-gray-400 font-bold text-xs bg-gray-50 px-2 py-1 rounded">NOT AVAIL</span>;
  };

  // Live Matching logic for UI Display (Matches the service logic loosely for display purposes)
  const amountSignal = getMatchSignal(donation.amount, trustedTx?.amount);
  const utrSignal = getMatchSignal(donation.utr, trustedTx?.utr);
  
  const oDate = donation.donatedAt ? donation.donatedAt.toISOString().split('T')[0] : null;
  const tDate = trustedTx?.transactionDate ? trustedTx.transactionDate.toISOString().split('T')[0] : null;
  const dateSignal = getMatchSignal(oDate, tDate); // Simplified for UI, engine uses tolerance
  
  const nameSignal = compareNames(donation.donorName, trustedTx?.bankTransactionId ? 'BANK NAME' : null); // Mock

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
             <Link href="/admin/verification" className="text-gray-400 hover:text-gray-600">
               &larr; Back to Queue
             </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Verify Donation: {donation.id.slice(0, 8)}</h1>
        </div>
        <div className="flex gap-2 items-center">
            <StatusBadge status={donation.status} />
            <AutoVerifyButton donationId={donation.id} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* DONATION DATA */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">DONATION</h2>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-3"><span className="text-gray-500">ID</span><span className="col-span-2 font-mono text-xs">{donation.id}</span></div>
            <div className="grid grid-cols-3"><span className="text-gray-500">Name</span><span className="col-span-2 font-medium">{donation.donorName || '-'}</span></div>
            <div className="grid grid-cols-3"><span className="text-gray-500">Amount</span><span className="col-span-2 font-medium">₹{donation.amount}</span></div>
            <div className="grid grid-cols-3"><span className="text-gray-500">Method</span><span className="col-span-2 font-medium">{donation.paymentMethod || '-'}</span></div>
            <div className="grid grid-cols-3"><span className="text-gray-500">UTR</span><span className="col-span-2 font-medium">{donation.utr || '-'}</span></div>
            <div className="grid grid-cols-3"><span className="text-gray-500">Date</span><span className="col-span-2 font-medium">{oDate || '-'}</span></div>
          </div>
        </Card>

        {/* OCR DATA */}
        <Card className="p-6 border-blue-100 bg-blue-50/20">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b border-blue-100 pb-2 flex justify-between">
              <span>OCR DATA</span>
              <span className="text-[10px] text-blue-600 font-bold bg-blue-100 px-2 py-0.5 rounded">EXTRACTED</span>
          </h2>
          {ocrResult ? (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-3"><span className="text-gray-500">Name</span><span className="col-span-2 font-medium">{ocrResult.extractedDonorName || '-'}</span></div>
            <div className="grid grid-cols-3"><span className="text-gray-500">Amount</span><span className="col-span-2 font-medium">₹{ocrResult.extractedAmount || '-'}</span></div>
            <div className="grid grid-cols-3"><span className="text-gray-500">UTR</span><span className="col-span-2 font-medium">{ocrResult.extractedUtr || '-'}</span></div>
            <div className="grid grid-cols-3"><span className="text-gray-500">Date</span><span className="col-span-2 font-medium">{ocrResult.extractedDate ? ocrResult.extractedDate.toISOString().split('T')[0] : '-'}</span></div>
            <div className="grid grid-cols-3"><span className="text-gray-500">Status</span><span className="col-span-2 font-medium">{ocrResult.extractedPaymentStatus || '-'}</span></div>
          </div>
          ) : (
            <div className="text-gray-500 text-sm">No OCR data available.</div>
          )}
        </Card>

        {/* TRUSTED TRANSACTION */}
        <Card className="p-6 border-emerald-100 bg-emerald-50/20">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b border-emerald-100 pb-2 flex justify-between">
              <span>TRUSTED TX</span>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-100 px-2 py-0.5 rounded">TRUSTED SOURCE</span>
          </h2>
          {trustedTx ? (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-3"><span className="text-gray-500">Source</span><span className="col-span-2 font-medium">{trustedTx.source}</span></div>
            <div className="grid grid-cols-3"><span className="text-gray-500">Amount</span><span className="col-span-2 font-medium">₹{trustedTx.amount}</span></div>
            <div className="grid grid-cols-3"><span className="text-gray-500">UTR</span><span className="col-span-2 font-medium">{trustedTx.utr || '-'}</span></div>
            <div className="grid grid-cols-3"><span className="text-gray-500">Date</span><span className="col-span-2 font-medium">{tDate || '-'}</span></div>
            <div className="grid grid-cols-3"><span className="text-gray-500">Status</span><span className="col-span-2 font-medium text-emerald-600">{trustedTx.status}</span></div>
          </div>
          ) : (
            <div className="text-gray-500 text-sm flex flex-col gap-4">
               <p>No trusted transaction found.</p>
               <MockTransactionForm 
                  donationId={donation.id} 
                  defaultAmount={donation.amount} 
                  defaultUtr={donation.utr} 
                  defaultDate={oDate}
               />
            </div>
          )}
        </Card>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">MATCHING RESULTS (Live UI Eval)</h2>
            <div className="space-y-3 text-sm">
                <div className="grid grid-cols-3"><span className="text-gray-500">UTR</span><span className="col-span-2">{renderSignal(utrSignal)}</span></div>
                <div className="grid grid-cols-3"><span className="text-gray-500">Amount</span><span className="col-span-2">{renderSignal(amountSignal)}</span></div>
                <div className="grid grid-cols-3"><span className="text-gray-500">Date</span><span className="col-span-2">{renderSignal(dateSignal)}</span></div>
                <div className="grid grid-cols-3"><span className="text-gray-500">Name</span><span className="col-span-2">{renderSignal(nameSignal)}</span></div>
            </div>
          </Card>

          <Card className="p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">DECISION</h2>
              {lastAttempt && (
                <div className="mb-4 p-3 bg-gray-50 rounded-md text-sm border border-gray-200">
                    <p className="font-semibold text-gray-700">Last Attempt: {lastAttempt.resultStatus}</p>
                    <p className="text-gray-600 text-xs mt-1">Source: {lastAttempt.source}</p>
                    <p className="text-gray-500 text-xs mt-1">Notes: {lastAttempt.notes}</p>
                </div>
              )}
            </div>
            
            <div className="border-t pt-4 mt-auto">
               <p className="text-sm text-gray-500 mb-3">Manual Override</p>
               <ManualDecisionButtons donationId={donation.id} />
            </div>
          </Card>
      </div>

    </div>
  );
}
