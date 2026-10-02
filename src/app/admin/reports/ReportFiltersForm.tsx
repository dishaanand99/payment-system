'use client';
import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ReportFilters } from '@/lib/reports/types';

export default function ReportFiltersForm({ initialFilters }: { initialFilters: ReportFilters }) {
    const router = useRouter();
    const pathname = usePathname();

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const params = new URLSearchParams();
        
        for (const [key, value] of formData.entries()) {
            if (value && value !== 'ALL') {
                params.append(key, value.toString());
            }
        }
        
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date From</label>
                <input type="date" name="dateFrom" defaultValue={initialFilters.dateFrom || ''} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date To</label>
                <input type="date" name="dateTo" defaultValue={initialFilters.dateTo || ''} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select name="status" defaultValue={initialFilters.status || 'ALL'} className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                    <option value="ALL">All Statuses</option>
                    <option value="VERIFIED">Verified</option>
                    <option value="PENDING">Pending</option>
                    <option value="NEEDS_MANUAL_REVIEW">Needs Manual Review</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="DUPLICATE">Duplicate</option>
                </select>
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Payment Method</label>
                <select name="paymentMethod" defaultValue={initialFilters.paymentMethod || 'ALL'} className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                    <option value="ALL">All Methods</option>
                    <option value="UPI">UPI</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="PAYU">PayU</option>
                    <option value="OTHER">Other</option>
                </select>
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Trusted Source</label>
                <select name="trustedSource" defaultValue={initialFilters.trustedSource || 'ALL'} className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                    <option value="ALL">All Sources</option>
                    <option value="BANK_STATEMENT">Bank Statement</option>
                    <option value="PAYU_WEBHOOK">PayU Webhook</option>
                    <option value="MANUAL">Manual Verification</option>
                    <option value="NONE">None</option>
                </select>
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Donor Name</label>
                <input type="text" name="donorName" defaultValue={initialFilters.donorName || ''} placeholder="Search name..." className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">UTR / Ref</label>
                <input type="text" name="utr" defaultValue={initialFilters.utr || ''} placeholder="Search UTR..." className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
            </div>
            <div className="flex items-end gap-2">
                <button type="submit" className="bg-gray-900 text-white px-4 py-2 text-sm font-medium rounded hover:bg-gray-800 flex-1">Apply Filters</button>
                <button type="button" onClick={() => router.push(pathname)} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 text-sm font-medium rounded hover:bg-gray-50 flex-1">Clear</button>
            </div>
        </form>
    );
}
