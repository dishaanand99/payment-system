import React from 'react';
import { MOCK_AUDIT } from '@/lib/mock-data';
import { Card } from '@/components/ui/shared';
import { requireAuth } from '@/lib/auth/session';
import { canViewAuditLogs, Role } from '@/lib/auth/permissions';
import { redirect } from 'next/navigation';

export default async function AuditLogsPage() {
  const session = await requireAuth();
  if (!canViewAuditLogs(session.role as Role)) {
    redirect('/admin/unauthorized');
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-sm text-gray-500 mt-1">Immutable record of all system actions and manual overrides.</p>
        </div>
      </div>

      <Card>
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex gap-4">
          <input type="text" placeholder="Search logs..." className="flex-1 max-w-sm px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          <select className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
            <option>All Actions</option>
            <option>VERIFIED_DONATION</option>
            <option>OCR_EXTRACTION</option>
            <option>REJECTED_DONATION</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-medium">Timestamp</th>
                <th className="px-6 py-3 font-medium">Admin / User</th>
                <th className="px-6 py-3 font-medium">Action</th>
                <th className="px-6 py-3 font-medium">Entity</th>
                <th className="px-6 py-3 font-medium">Entity ID</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {MOCK_AUDIT.map(log => (
                <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-gray-500 font-mono text-xs">{log.timestamp}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{log.admin}</td>
                  <td className="px-6 py-4">
                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-mono">{log.action}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{log.entity}</td>
                  <td className="px-6 py-4 font-medium text-blue-600 hover:underline cursor-pointer">{log.entityId}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${log.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
