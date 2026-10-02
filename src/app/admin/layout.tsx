import React from 'react';
import { getSession } from '@/lib/auth/session';
import AdminClientLayout from './AdminClientLayout';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <AdminClientLayout session={session}>
      {children}
    </AdminClientLayout>
  );
}
