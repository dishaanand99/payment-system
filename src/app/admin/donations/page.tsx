import React from 'react';
import Link from 'next/link';
import { getDonations } from '@/lib/services/donations';
import { Card, StatusBadge, Button } from '@/components/ui/shared';
import { requireAuth } from '@/lib/auth/session';
import { canViewDonation, Role } from '@/lib/auth/permissions';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function DonationsPage({ searchParams }: { searchParams: Promise<{ q?: string, status?: string }> }) {
  const session = await requireAuth();
  if (!canViewDonation(session.role as Role)) {
    redirect('/admin/unauthorized');
  }

  const { q, status } = await searchParams;
  const donations = await getDonations(undefined, q, status);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">All Donations</h1>
        <form className="flex gap-2" method="GET" action="/admin/donations">
          <input name="q" defaultValue={q} type="text" placeholder="Search ID, Name, UTR..." className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64" />
          <select name="status" defaultValue={status} className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="VERIFIED">VERIFIED</option>
            <option value="NEEDS_MANUAL_REVIEW">REVIEW</option>
          </select>
          <Button variant="secondary" type="submit">Filter</Button>
        </form>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-medium">Donation ID</th>
                <th className="px-6 py-3 font-medium">Date & Time</th>
                <th className="px-6 py-3 font-medium">Donor Name</th>
                <th className="px-6 py-3 font-medium">Amount</th>
                <th className="px-6 py-3 font-medium">Method & UTR</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {donations.map(don => (
                <tr key={don.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{don.id}</td>
                  <td className="px-6 py-4 text-gray-500">{new Date(don.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{don.donorName}</td>
                  <td className="px-6 py-4 font-semibold text-gray-900">₹{don.amount.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <div className="text-gray-900">{don.paymentMethod?.replace('_', ' ') || '-'}</div>
                    <div className="text-xs text-gray-500 font-mono mt-0.5">{don.utr || '-'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={don.status} />
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Link href={`/admin/donations/${don.id}`} className="text-blue-600 hover:text-blue-800 font-medium text-sm">View</Link>
                  </td>
                </tr>
              ))}
              {donations.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-gray-500">No donations found in database.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
