import React from 'react';
import { requireAuth } from '@/lib/auth/session';
import { canManageUsers } from '@/lib/auth/permissions';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { Card, Button, StatusBadge } from '@/components/ui/shared';
import { toggleUserStatusAction } from '@/app/actions';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const session = await requireAuth();
  
  if (!canManageUsers(session.role as any)) {
    redirect('/admin/unauthorized');
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <Link href="/admin/users/new">
          <Button variant="primary">Add New User</Button>
        </Link>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Role</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Created</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                  <td className="px-6 py-4 text-gray-500">{user.email}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{user.role}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">Edit</button>
                    <form action={toggleUserStatusAction.bind(null, user.id)} className="inline-block ml-3">
                      {user.isActive ? (
                        <button type="submit" className="text-amber-600 hover:text-amber-800 font-medium text-sm">Deactivate</button>
                      ) : (
                        <button type="submit" className="text-emerald-600 hover:text-emerald-800 font-medium text-sm">Activate</button>
                      )}
                    </form>
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
