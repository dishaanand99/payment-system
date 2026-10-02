import React from 'react';
import { requireAuth } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/shared';
import { getDashboardSummary, getPaymentMethodSummary, getBankReconciliationSummary, getPayUSummary } from '@/lib/reports/summaries';
import { buildDonationQuery } from '@/lib/reports/filters';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import ReportFiltersForm from './ReportFiltersForm';

export default async function ReportsPage({ searchParams }: { searchParams: { [key: string]: string | undefined } }) {
  const session = await requireAuth();
  if (session.role !== 'SUPER_ADMIN' && session.role !== 'ADMIN') {
    redirect('/admin/unauthorized');
  }

  const filters = await searchParams;
  const page = parseInt(filters.page || '1');
  const limit = parseInt(filters.limit || '20');
  const skip = (page - 1) * limit;

  const where = buildDonationQuery(filters);

  // Summaries
  const dashboardSummary = await getDashboardSummary(filters);
  const paymentMethodSummary = await getPaymentMethodSummary(filters);
  const bankReconciliation = await getBankReconciliationSummary();
  const payuSummary = await getPayUSummary();

  // Data
  const donations = await prisma.donation.findMany({
    where,
    orderBy: { donatedAt: 'desc' },
    skip,
    take: limit,
    include: {
      transactions: true,
      ocrResults: true,
      verificationAttempts: true,
    }
  });

  const totalFilteredCount = await prisma.donation.count({ where });
  const totalPages = Math.ceil(totalFilteredCount / limit);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Accounting & Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Professional exportable reports and reconciliations.</p>
        </div>
        <div className="flex gap-2">
           <form action="/api/admin/reports/export" method="GET" className="inline-flex gap-2">
              {Object.entries(filters).filter(([k]) => k !== 'page' && k !== 'limit').map(([k, v]) => (
                 <input key={k} type="hidden" name={k} value={v || ''} />
              ))}
              <button type="submit" name="format" value="csv" className="bg-white border border-gray-300 px-4 py-2 text-sm font-medium rounded shadow-sm hover:bg-gray-50 text-gray-700">Export CSV</button>
              <button type="submit" name="format" value="xlsx" className="bg-blue-600 text-white px-4 py-2 text-sm font-medium rounded shadow-sm hover:bg-blue-700">Export XLSX</button>
           </form>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <Card className="p-4 bg-white border border-gray-200">
            <div className="text-sm font-semibold text-gray-500 uppercase">Total Donations</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">{dashboardSummary.totalDonations}</div>
         </Card>
         <Card className="p-4 bg-white border border-emerald-100">
            <div className="text-sm font-semibold text-emerald-600 uppercase">Verified Amount</div>
            <div className="mt-2 text-3xl font-bold text-emerald-700">₹{dashboardSummary.totalVerifiedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
         </Card>
         <Card className="p-4 bg-white border border-amber-100">
            <div className="text-sm font-semibold text-amber-600 uppercase">Pending Amount</div>
            <div className="mt-2 text-3xl font-bold text-amber-700">₹{dashboardSummary.totalPendingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
         </Card>
         <Card className="p-4 bg-white border border-gray-200">
            <div className="text-sm font-semibold text-gray-500 uppercase">Manual Review</div>
            <div className="mt-2 text-3xl font-bold text-rose-600">{dashboardSummary.needsManualReview}</div>
         </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="md:col-span-2">
            <Card className="p-6 h-full">
               <h2 className="text-lg font-bold text-gray-900 mb-4">Bank Reconciliation</h2>
               <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Bank Txns</div>
                    <div className="font-semibold">{bankReconciliation.totalBankTransactions}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Matched</div>
                    <div className="font-semibold text-emerald-600">{bankReconciliation.matchedTransactions}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Unmatched Credits</div>
                    <div className="font-semibold text-amber-600">{bankReconciliation.unmatchedCredits}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Unreconciled Amt</div>
                    <div className="font-semibold text-rose-600">₹{bankReconciliation.unreconciledCreditAmount.toLocaleString()}</div>
                  </div>
               </div>
            </Card>
         </div>
         <div className="md:col-span-1">
             <Card className="p-6 h-full">
               <h2 className="text-lg font-bold text-gray-900 mb-4">PayU Summary</h2>
               <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                     <span className="text-gray-500">Total Attempts</span>
                     <span className="font-semibold">{payuSummary.totalTransactions}</span>
                  </div>
                  <div className="flex justify-between">
                     <span className="text-gray-500">Successful</span>
                     <span className="font-semibold text-emerald-600">{payuSummary.successfulPayments}</span>
                  </div>
                  <div className="flex justify-between">
                     <span className="text-gray-500">Linked to Don.</span>
                     <span className="font-semibold text-blue-600">{payuSummary.linkedToDonations}</span>
                  </div>
               </div>
             </Card>
         </div>
      </div>

      <Card className="p-6">
         <h2 className="text-lg font-bold text-gray-900 mb-4">Report Filters</h2>
         <ReportFiltersForm initialFilters={filters} />
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-medium">Receipt No.</th>
                <th className="px-6 py-3 font-medium">Donation Date</th>
                <th className="px-6 py-3 font-medium">Donor Name</th>
                <th className="px-6 py-3 font-medium">Amount</th>
                <th className="px-6 py-3 font-medium">Data Provenance (UTRs)</th>
                <th className="px-6 py-3 font-medium">Trusted Source</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {donations.map(d => {
                 const trustedTx = d.transactions[0];
                 const ocr = d.ocrResults[0];
                 
                 return (
                  <tr key={d.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-mono text-xs text-gray-900">{d.receiptNumber || '-'}</td>
                    <td className="px-6 py-4 text-gray-500">{d.donatedAt ? d.donatedAt.toLocaleDateString('en-IN') : d.createdAt.toLocaleDateString('en-IN')}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{d.donorName}</td>
                    <td className="px-6 py-4 font-semibold">₹{d.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4">
                       <div className="flex flex-col gap-1">
                          <span className="text-xs text-gray-500">Donor: {d.utr || 'N/A'}</span>
                          {ocr && <span className="text-xs text-gray-500">OCR: {ocr.extractedUtr || 'N/A'}</span>}
                          {trustedTx && <span className="text-xs font-semibold text-emerald-600">Trusted: {trustedTx.utr || 'N/A'}</span>}
                       </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-gray-600">
                       {trustedTx ? trustedTx.source : 'NONE'}
                    </td>
                    <td className="px-6 py-4">
                       <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          d.status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700' :
                          d.status === 'PENDING' ? 'bg-amber-50 text-amber-700' :
                          d.status === 'NEEDS_MANUAL_REVIEW' ? 'bg-rose-50 text-rose-700' :
                          'bg-gray-100 text-gray-700'
                       }`}>
                          {d.status}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <Link href={`/admin/donations/${d.id}`} className="text-blue-600 hover:underline text-sm font-medium">Details</Link>
                    </td>
                  </tr>
                 );
              })}
              {donations.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-gray-500">No donations match the current filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
            <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm">
                <div className="text-gray-500">Showing {skip + 1} to {Math.min(skip + limit, totalFilteredCount)} of {totalFilteredCount} entries</div>
                <div className="flex gap-2">
                    {page > 1 && (
                        <Link href={`?${new URLSearchParams({...filters, page: (page - 1).toString()}).toString()}`} className="px-3 py-1 border rounded text-gray-600 hover:bg-gray-50">Previous</Link>
                    )}
                    {page < totalPages && (
                        <Link href={`?${new URLSearchParams({...filters, page: (page + 1).toString()}).toString()}`} className="px-3 py-1 border rounded text-gray-600 hover:bg-gray-50">Next</Link>
                    )}
                </div>
            </div>
        )}
      </Card>
    </div>
  );
}
