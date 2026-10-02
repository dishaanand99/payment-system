import React from 'react';
import { requireAuth } from '@/lib/auth/session';
import { NotificationService } from '@/lib/notifications';
import { Bell, Heart, FileWarning, Landmark, CreditCard, CircleAlert, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { Notification } from '@prisma/client';

export const dynamic = 'force-dynamic';

function getIcon(type: string) {
  switch (type) {
    case 'NEW_DONATION': return <Heart className="w-5 h-5 text-pink-500" />;
    case 'OCR_MISMATCH': return <FileWarning className="w-5 h-5 text-amber-500" />;
    case 'BANK_TRANSACTION_UNMATCHED': return <Landmark className="w-5 h-5 text-blue-500" />;
    case 'PAYU_PAYMENT_SUCCESS': return <CreditCard className="w-5 h-5 text-emerald-500" />;
    case 'PAYMENT_AMOUNT_MISMATCH': return <CircleAlert className="w-5 h-5 text-rose-500" />;
    case 'DUPLICATE_UTR': return <ShieldAlert className="w-5 h-5 text-rose-600" />;
    default: return <Bell className="w-5 h-5 text-gray-500" />;
  }
}

function getUrl(n: Notification) {
  if (n.type === 'NEW_DONATION' || n.type === 'PAYMENT_AMOUNT_MISMATCH' || n.type === 'DUPLICATE_UTR') {
    return `/admin/verification/${n.donationId}`;
  }
  if (n.type === 'OCR_MISMATCH') return `/admin/ocr/${n.donationId}`;
  if (n.type === 'BANK_TRANSACTION_UNMATCHED') return `/admin/reconciliation`;
  if (n.type === 'PAYU_PAYMENT_SUCCESS') return `/admin/payu/${n.paymentGatewayTransactionId}`;
  return `/admin/notifications`;
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'INFO': return 'bg-blue-100 text-blue-800';
    case 'WARNING': return 'bg-amber-100 text-amber-800';
    case 'HIGH': return 'bg-rose-100 text-rose-800';
    case 'CRITICAL': return 'bg-rose-600 text-white font-bold';
    default: return 'bg-gray-100 text-gray-800';
  }
}

export default async function NotificationsPage() {
  const session = await requireAuth();
  
  const service = new NotificationService();
  const notifications = await service.getUserNotifications(session.userId, session.role, 0, 100);
  const unreadCount = await service.getUnreadCount(session.userId, session.role);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-gray-400" />
            Alerts & Notifications
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            You have {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <ul className="divide-y divide-gray-100">
          {notifications.length === 0 ? (
            <li className="p-8 text-center text-gray-500">No notifications found.</li>
          ) : (
            notifications.map((notif) => (
              <li 
                key={notif.id} 
                className={`p-5 flex flex-col sm:flex-row sm:items-start gap-4 hover:bg-gray-50 transition-colors ${!notif.isRead ? 'bg-blue-50/20' : ''}`}
              >
                <div className="mt-1 shrink-0 p-2 bg-white rounded-lg shadow-sm border border-gray-100">
                  {getIcon(notif.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                    <h3 className={`text-base ${!notif.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                      {notif.title}
                    </h3>
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] uppercase tracking-wide w-max ${getPriorityColor(notif.priority)}`}>
                      {notif.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    {notif.message}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
                    <Link 
                      href={getUrl(notif)}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      View Details &rarr;
                    </Link>
                    <span className="text-gray-400">&bull;</span>
                    <span className="text-gray-500">
                      {new Date(notif.createdAt).toLocaleString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
