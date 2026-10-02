import React from 'react';
import { requireAuth } from '@/lib/auth/session';
import { canImportBankStatement, Role } from '@/lib/auth/permissions';
import { redirect } from 'next/navigation';

export default async function ReconciliationLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();
  if (!canImportBankStatement(session.role as Role)) {
    redirect('/admin/unauthorized');
  }
  return <>{children}</>;
}
