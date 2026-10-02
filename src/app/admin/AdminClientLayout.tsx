"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SessionPayload } from '@/lib/auth/session';
import { canImportBankStatement, canExportReports, canManageUsers, canViewAuditLogs, canManageSettings, Role } from '@/lib/auth/permissions';
import { logoutAction } from '@/app/actions';
import { NotificationBell } from '@/components/ui/NotificationBell';

export default function AdminClientLayout({ children, session }: { children: React.ReactNode, session: SessionPayload | null }) {
  const pathname = usePathname();

  // If there's no session, we might be on the login page or unauthorized page, so just render children
  // Or handle standard wrapper if needed. But login page should probably not have this sidebar.
  // Wait, login page is inside /admin. Let's check pathname.
  if (!session || pathname === '/admin/login' || pathname === '/admin/unauthorized') {
    return <>{children}</>;
  }

  const role = session.role as Role;

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", show: true },
    { name: "Donations", href: "/admin/donations", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", show: true },
    { name: "Verification", href: "/admin/verification", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", show: ['SUPER_ADMIN', 'ADMIN', 'VERIFIER'].includes(role) },
    { name: "Bank Reconciliation", href: "/admin/reconciliation", icon: "M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z", show: canImportBankStatement(role) || ['SUPER_ADMIN', 'ADMIN', 'VERIFIER'].includes(role) },
    { name: "OCR Processing", href: "/admin/ocr", icon: "M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z", show: ['SUPER_ADMIN', 'ADMIN', 'VERIFIER'].includes(role) },
    { name: "Reports", href: "/admin/reports", icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", show: canExportReports(role) },
    { name: "Users", href: "/admin/users", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z", show: canManageUsers(role) },
    { name: "Audit Logs", href: "/admin/audit", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", show: canViewAuditLogs(role) },
    { name: "Settings", href: "/admin/settings", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z", show: canManageSettings(role) }
  ];

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 bg-slate-950 border-b border-slate-800">
          <span className="text-xl font-bold tracking-wide">HopeAdmin</span>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {navItems.filter(i => i.show).map(item => {
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href));
              return (
                <Link key={item.name} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
                  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                    {item.name === 'Settings' && <circle cx="12" cy="12" r="3" strokeWidth="2" />}
                  </svg>
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
          Standalone NGO System v1.0
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-800 hidden sm:block">Admin Portal</h2>
          </div>
          <div className="flex items-center gap-5">
            <div className="flex flex-col text-right">
              <span className="text-sm font-medium text-gray-900">{session.name}</span>
              <span className="text-xs text-gray-500">{session.role}</span>
            </div>
            
            <NotificationBell />

            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
              {session.name.substring(0,2).toUpperCase()}
            </div>
            <form action={logoutAction}>
              <button className="text-sm font-medium text-rose-600 hover:text-rose-800">Logout</button>
            </form>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
