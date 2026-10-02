import React from 'react';
import Link from 'next/link';
import { getDashboardStats, getDonations } from '@/lib/services/donations';
import { Card, StatCard, StatusBadge, Button } from '@/components/ui/shared';
import { requireAuth } from '@/lib/auth/session';
import { canViewDashboard, Role } from '@/lib/auth/permissions';
import { redirect } from 'next/navigation';

export default async function AdminDashboard() {
  const session = await requireAuth();
  if (!canViewDashboard(session.role as Role)) {
    redirect('/admin/unauthorized');
  }

  const stats = await getDashboardStats();
  const recentDonations = await getDonations(5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor donations and verify incoming payments.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary">Export PDF</Button>
          <Button variant="primary">Generate Report</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Donations" value={stats.totalDonations} icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} color="blue" />
        <StatCard title="Verified Amt" value={`₹${stats.verifiedAmount.toLocaleString()}`} icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} color="emerald" />
        <StatCard title="Pending" value={stats.pending} icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} color="amber" />
        <StatCard title="Review Required" value={stats.reviewRequired} icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>} color="orange" />
      </div>

      <Card className="mt-8">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Recent Donations</h3>
          <Link href="/admin/donations" className="text-blue-600 text-sm font-medium hover:underline">View All</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-medium">Donation ID</th>
                <th className="px-6 py-3 font-medium">Donor</th>
                <th className="px-6 py-3 font-medium">Amount</th>
                <th className="px-6 py-3 font-medium">Method</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentDonations.map(don => (
                <tr key={don.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{don.id}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{don.donorName}</div>
                    <div className="text-xs text-gray-500">{new Date(don.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-900">₹{don.amount.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <div className="text-gray-900">{don.paymentMethod?.replace('_', ' ') || '-'}</div>
                    <div className="text-xs text-gray-500 font-mono">{don.utr || '-'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={don.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/admin/donations/${don.id}`} className="text-blue-600 hover:text-blue-800 font-medium text-sm px-3 py-1.5 rounded-md hover:bg-blue-50">View Details</Link>
                  </td>
                </tr>
              ))}
              {recentDonations.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No donations found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
