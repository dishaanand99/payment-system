import React from 'react';
import { requireAuth } from '@/lib/auth/session';
import { canManageSettings, Role } from '@/lib/auth/permissions';
import { redirect } from 'next/navigation';

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();
  if (!canManageSettings(session.role as Role)) {
    redirect('/admin/unauthorized');
  }
  return <>{children}</>;
}
