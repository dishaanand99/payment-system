import React from 'react';
import Link from 'next/link';
import { getDonationById } from '@/lib/services/donations';
import { Card, StatusBadge, Button } from '@/components/ui/shared';
import { notFound, redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth/session';
import { canViewDonation, Role } from '@/lib/auth/permissions';

export default async function DonationDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth();
  if (!canViewDonation(session.role as Role)) {
    redirect('/admin/unauthorized');
  }

  const { id } = await params;
  const donation = await getDonationById(id);

  if (!donation) {
    notFound();
  }

  // Fallbacks for mock presentation since we haven't implemented bank reconciliation engines yet.
  const ocrStatus = donation.ocrResults?.[0]?.status || 'PENDING';
  const bankMatch = 'NOT CHECKED';
  const pgMatch = 'NOT CHECKED';
  const riskStatus: string = 'LOW';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/donations" className="p-2 text-gray-500 hover:text-gray-900 bg-white border border-gray-200 rounded-lg shadow-sm">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Donation {donation.id.split('-')[0] + '...'}</h1>
          <StatusBadge status={donation.status} />
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex gap-3">
            <Button variant="danger" disabled title="Available in a future verification phase.">Reject</Button>
            <Button variant="secondary" disabled title="Available in a future verification phase.">Mark Review Required</Button>
            <Button variant="success" disabled title="Available in a future verification phase.">Verify</Button>
          </div>
          <span className="text-xs text-gray-500">Actions available in a future verification phase.</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
              <h3 className="font-semibold text-gray-900">Donor Information</h3>
            </div>
            <div className="p-6 grid grid-cols-2 gap-y-4">
              <div>
                <p className="text-sm text-gray-500">Full Name</p>
                <p className="font-medium text-gray-900">{donation.donorName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Mobile</p>
                <p className="font-medium text-gray-900">{donation.donorPhone || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{donation.donorEmail || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">PAN</p>
                <p className="font-medium text-gray-900">{donation.donorPan || '-'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium text-gray-900">{donation.donorAddress || '-'}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
              <h3 className="font-semibold text-gray-900">Payment Information</h3>
            </div>
            <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-y-6">
              <div>
                <p className="text-sm text-gray-500">Amount</p>
                <p className="font-bold text-xl text-gray-900">₹{donation.amount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Method</p>
                <p className="font-medium text-gray-900">{donation.paymentMethod?.replace('_', ' ') || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">UTR / Ref</p>
                <p className="font-medium text-gray-900 font-mono">{donation.utr || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium text-gray-900">{new Date(donation.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Time</p>
                <p className="font-medium text-gray-900">{new Date(donation.createdAt).toLocaleTimeString()}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Admin Notes</h3>
              <Button variant="secondary" className="!py-1.5 !text-xs">Add Note</Button>
            </div>
            <div className="p-6 text-sm text-gray-500 italic">
              {donation.notes.length === 0 ? 'No notes added yet.' : (
                <ul className="space-y-3">
                  {donation.notes.map(note => (
                    <li key={note.id} className="text-gray-900 not-italic">
                      <p>{note.content}</p>
                      <p className="text-xs text-gray-500 mt-1">- {note.author.name}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
          
          <Card>
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
              <h3 className="font-semibold text-gray-900">Audit History</h3>
            </div>
            <div className="p-6">
              <ul className="space-y-4 text-sm">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500"></div>
                  <div>
                    <p className="text-gray-900">Donation submitted</p>
                    <p className="text-xs text-gray-500">System - {new Date(donation.createdAt).toLocaleString()}</p>
                  </div>
                </li>
                {donation.status === "VERIFIED" && donation.verifiedAt && (
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-emerald-500"></div>
                    <div>
                      <p className="text-gray-900">Verified by Admin</p>
                      <p className="text-xs text-gray-500">User ID: {donation.verifiedById} - {new Date(donation.verifiedAt).toLocaleString()}</p>
                    </div>
                  </li>
                )}
              </ul>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
              <h3 className="font-semibold text-gray-900">Payment Screenshot</h3>
            </div>
            <div className="p-4">
              {donation.paymentScreenshotPath ? (
                <div className="rounded-lg overflow-hidden border border-gray-200">
                  <img src={`/api/admin/donations/${donation.id}/screenshot`} alt="Payment Screenshot" className="w-full h-auto" />
                </div>
              ) : (
                <div className="aspect-[3/4] bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                  <span className="text-gray-400 text-sm">No screenshot uploaded</span>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
              <h3 className="font-semibold text-gray-900">Verification Engine</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded text-sm mb-4">
                <p className="font-medium">Information</p>
                <p>OCR processing has not been implemented yet.</p>
                <p>Payment verification has not been performed.</p>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-sm text-gray-500">OCR Extraction</span>
                <StatusBadge status={ocrStatus} />
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-sm text-gray-500">Bank Statement</span>
                <StatusBadge status={bankMatch} />
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-sm text-gray-500">Payment Gateway</span>
                <StatusBadge status={pgMatch} />
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm font-medium text-gray-900">Risk Assessment</span>
                <span className={`text-xs font-bold px-2 py-1 rounded ${riskStatus === 'HIGH' ? 'bg-rose-100 text-rose-700' : riskStatus === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {riskStatus} RISK
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
