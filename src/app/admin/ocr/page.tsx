import React from 'react';
import Link from 'next/link';
import { Card, StatusBadge, Button } from '@/components/ui/shared';
import { requireAuth } from '@/lib/auth/session';
import { canVerifyDonation, Role } from '@/lib/auth/permissions';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { ProcessOCRButton } from './ProcessOCRButton';

export default async function OCRProcessingPage() {
  const session = await requireAuth();
  if (!canVerifyDonation(session.role as Role)) {
    redirect('/admin/unauthorized');
  }

  // Find donations with screenshots
  const donationsWithScreenshots = await prisma.donation.findMany({
    where: {
      paymentScreenshotPath: { not: null },
    },
    include: {
      ocrResults: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">OCR Processing</h1>
          <p className="text-sm text-gray-500 mt-1">Review text extracted from uploaded payment screenshots.</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3 text-sm text-blue-800">
        <svg className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <p><strong>Note:</strong> OCR extraction speeds up manual verification but cannot be used as the sole source of truth for payment verification.</p>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-medium">Screenshot</th>
                <th className="px-6 py-3 font-medium">Donation ID</th>
                <th className="px-6 py-3 font-medium">Donor Name</th>
                <th className="px-6 py-3 font-medium">Original Amount</th>
                <th className="px-6 py-3 font-medium">OCR Status</th>
                <th className="px-6 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {donationsWithScreenshots.map(don => {
                const latestOcr = don.ocrResults[0];
                const status = latestOcr ? latestOcr.status : 'PENDING';
                
                return (
                  <tr key={don.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="w-12 h-16 bg-gray-200 rounded overflow-hidden flex items-center justify-center border border-gray-300">
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      <Link href={`/admin/donations/${don.id}`} className="hover:underline">{don.id.slice(0, 8)}...</Link>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{don.donorName || 'N/A'}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">₹{don.amount}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={status} />
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      {status === 'PENDING' ? (
                        <ProcessOCRButton donationId={don.id} label="Process OCR" />
                      ) : (
                        <>
                           <Link href={`/admin/ocr/${don.id}`}>
                             <Button variant="secondary" className="!px-3 !py-1.5 text-xs">View Result</Button>
                           </Link>
                           <ProcessOCRButton donationId={don.id} label="Reprocess" />
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
              {donationsWithScreenshots.length === 0 && (
                 <tr>
                   <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                     No donations with screenshots found.
                   </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
