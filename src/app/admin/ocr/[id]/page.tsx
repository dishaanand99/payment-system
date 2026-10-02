import React from 'react';
import Link from 'next/link';
import { Card, StatusBadge, Button } from '@/components/ui/shared';
import { requireAuth } from '@/lib/auth/session';
import { canVerifyDonation, Role } from '@/lib/auth/permissions';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { ProcessOCRButton } from '../ProcessOCRButton';

export default async function OCRResultPage({ params }: { params: { id: string } }) {
  const session = await requireAuth();
  if (!canVerifyDonation(session.role as Role)) {
    redirect('/admin/unauthorized');
  }

  const { id } = await params;

  const donation = await prisma.donation.findUnique({
    where: { id },
    include: {
      ocrResults: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!donation) {
    return <div className="p-6">Donation not found</div>;
  }

  const ocrResult = donation.ocrResults[0];

  if (!ocrResult) {
    return (
      <div className="p-6 space-y-4">
        <div>No OCR result found for this donation.</div>
        <ProcessOCRButton donationId={donation.id} label="Process Now" />
      </div>
    );
  }

  const getMatchSignal = (original: any, extracted: any) => {
    if (!original || !extracted) return 'NOT_AVAILABLE';
    return String(original).toLowerCase() === String(extracted).toLowerCase() ? 'MATCH' : 'MISMATCH';
  };

  const amountMatch = getMatchSignal(donation.amount, ocrResult.extractedAmount);
  const utrMatch = getMatchSignal(donation.utr, ocrResult.extractedUtr);
  
  // Date match simple logic
  const originalDateStr = donation.donatedAt ? donation.donatedAt.toISOString().split('T')[0] : null;
  const extractedDateStr = ocrResult.extractedDate ? ocrResult.extractedDate.toISOString().split('T')[0] : null;
  const dateMatch = getMatchSignal(originalDateStr, extractedDateStr);

  const renderSignal = (signal: string) => {
    if (signal === 'MATCH') return <span className="text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-1 rounded">MATCH</span>;
    if (signal === 'MISMATCH') return <span className="text-rose-600 font-bold text-xs bg-rose-50 px-2 py-1 rounded">MISMATCH</span>;
    return <span className="text-gray-400 font-bold text-xs bg-gray-50 px-2 py-1 rounded">NOT AVAIL</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
             <Link href="/admin/ocr" className="text-gray-400 hover:text-gray-600">
               &larr; Back to OCR Queue
             </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">OCR Result for {donation.id.slice(0, 8)}</h1>
        </div>
        <ProcessOCRButton donationId={donation.id} label="Reprocess Screenshot" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Original Donor Data</h2>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-3"><span className="text-gray-500">Donor Name</span><span className="col-span-2 font-medium">{donation.donorName || '-'}</span></div>
            <div className="grid grid-cols-3"><span className="text-gray-500">Amount</span><span className="col-span-2 font-medium">₹{donation.amount}</span></div>
            <div className="grid grid-cols-3"><span className="text-gray-500">Payment Method</span><span className="col-span-2 font-medium">{donation.paymentMethod || '-'}</span></div>
            <div className="grid grid-cols-3"><span className="text-gray-500">UTR</span><span className="col-span-2 font-medium">{donation.utr || '-'}</span></div>
            <div className="grid grid-cols-3"><span className="text-gray-500">Date</span><span className="col-span-2 font-medium">{originalDateStr || '-'}</span></div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">OCR Extracted Data</h2>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-3"><span className="text-gray-500">Name</span><span className="col-span-2 font-medium">{ocrResult.extractedDonorName || '-'}</span></div>
            <div className="grid grid-cols-3"><span className="text-gray-500">Amount</span><span className="col-span-2 font-medium flex gap-2 items-center">{ocrResult.extractedAmount ? `₹${ocrResult.extractedAmount}` : '-'}{renderSignal(amountMatch)}</span></div>
            <div className="grid grid-cols-3"><span className="text-gray-500">UTR</span><span className="col-span-2 font-medium flex gap-2 items-center">{ocrResult.extractedUtr || '-'}{renderSignal(utrMatch)}</span></div>
            <div className="grid grid-cols-3"><span className="text-gray-500">Date</span><span className="col-span-2 font-medium flex gap-2 items-center">{extractedDateStr || '-'}{renderSignal(dateMatch)}</span></div>
            <div className="grid grid-cols-3"><span className="text-gray-500">Time</span><span className="col-span-2 font-medium">{ocrResult.extractedTime || '-'}</span></div>
            <div className="grid grid-cols-3"><span className="text-gray-500">Method</span><span className="col-span-2 font-medium">{ocrResult.extractedPaymentMethod || '-'}</span></div>
            <div className="grid grid-cols-3"><span className="text-gray-500">Bank/App</span><span className="col-span-2 font-medium">{ocrResult.extractedBankName || '-'}</span></div>
            <div className="grid grid-cols-3"><span className="text-gray-500">Payment Status</span><span className="col-span-2 font-medium">{ocrResult.extractedPaymentStatus || '-'}</span></div>
            <div className="grid grid-cols-3"><span className="text-gray-500">Confidence</span><span className="col-span-2 font-medium">{ocrResult.confidenceScore ? `${Math.round(ocrResult.confidenceScore)}%` : 'N/A'}</span></div>
          </div>
        </Card>
      </div>

      {(amountMatch === 'MISMATCH' || utrMatch === 'MISMATCH') && (
         <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 text-sm text-amber-800">
           <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
           <div>
             <p className="font-bold">Potential Review Required</p>
             <p className="mt-1">The OCR extracted values do not match the values submitted by the donor. This requires manual verification.</p>
           </div>
         </div>
      )}

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Raw OCR Text</h2>
        <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
          <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
            {ocrResult.rawText || 'No text extracted.'}
          </pre>
        </div>
      </Card>
    </div>
  );
}
