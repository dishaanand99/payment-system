'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, FileWarning, Heart, Landmark, CreditCard, CircleAlert, ShieldAlert } from 'lucide-react';
import { Notification } from '@prisma/client';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await fetch('/api/admin/notifications/unread-count');
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.count || 0);
        }
      } catch (error) {
        console.error('Error fetching notifications count:', error);
      }
    };

    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/admin/notifications?take=5');
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchUnreadCount();
    
    // Poll every 45 seconds
    const interval = setInterval(fetchUnreadCount, 45000);

    if (isOpen) {
      fetchNotifications();
    }

    return () => clearInterval(interval);
  }, [isOpen]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const markAsRead = async (id: string, url?: string) => {
    try {
      await fetch(`/api/admin/notifications/${id}/read`, { method: 'POST' });
      setUnreadCount(prev => Math.max(0, prev - 1));
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      
      if (url) {
        router.push(url);
        setIsOpen(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const markAllAsRead = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/admin/notifications/read-all', { method: 'POST' });
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'NEW_DONATION': return <Heart className="w-4 h-4 text-pink-500" />;
      case 'OCR_MISMATCH': return <FileWarning className="w-4 h-4 text-amber-500" />;
      case 'BANK_TRANSACTION_UNMATCHED': return <Landmark className="w-4 h-4 text-blue-500" />;
      case 'PAYU_PAYMENT_SUCCESS': return <CreditCard className="w-4 h-4 text-emerald-500" />;
      case 'PAYMENT_AMOUNT_MISMATCH': return <CircleAlert className="w-4 h-4 text-rose-500" />;
      case 'DUPLICATE_UTR': return <ShieldAlert className="w-4 h-4 text-rose-600" />;
      default: return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getUrl = (n: Notification) => {
    if (n.type === 'NEW_DONATION' || n.type === 'PAYMENT_AMOUNT_MISMATCH' || n.type === 'DUPLICATE_UTR') {
      return `/admin/verification/${n.donationId}`;
    }
    if (n.type === 'OCR_MISMATCH') return `/admin/ocr/${n.donationId}`;
    if (n.type === 'BANK_TRANSACTION_UNMATCHED') return `/admin/reconciliation`;
    if (n.type === 'PAYU_PAYMENT_SUCCESS') return `/admin/payu/${n.paymentGatewayTransactionId}`;
    return `/admin/notifications`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors rounded-full hover:bg-gray-100 focus:outline-none"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h3 className="font-semibold text-sm text-gray-800">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                No recent notifications
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notif) => {
                  const url = getUrl(notif);
                  return (
                    <div 
                      key={notif.id} 
                      className={`p-4 flex gap-3 hover:bg-gray-50 transition-colors cursor-pointer ${notif.isRead ? 'opacity-70' : 'bg-blue-50/30'}`}
                      onClick={() => markAsRead(notif.id, url)}
                    >
                      <div className="mt-0.5 shrink-0">
                        {getIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${notif.isRead ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                          {notif.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {notif.message}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-wide">
                          {new Date(notif.createdAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          <div className="border-t border-gray-100 p-2 text-center bg-gray-50">
            <Link 
              href="/admin/notifications" 
              onClick={() => setIsOpen(false)}
              className="text-xs font-medium text-gray-600 hover:text-gray-900"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
