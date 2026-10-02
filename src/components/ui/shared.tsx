import React from 'react';
import Link from 'next/link';

export function Card({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>{children}</div>;
}

export function StatCard({ title, value, icon, color }: { title: string, value: string | number, icon: React.ReactNode, color: string }) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    orange: "bg-orange-50 text-orange-600",
    rose: "bg-rose-50 text-rose-600",
    purple: "bg-purple-50 text-purple-600",
    gray: "bg-gray-50 text-gray-600",
  }[color] || "bg-gray-50 text-gray-600";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className={`p-3 rounded-lg ${colorClasses}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const styles = {
    "VERIFIED": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "PENDING": "bg-amber-50 text-amber-700 border-amber-200",
    "REVIEW_REQUIRED": "bg-orange-50 text-orange-700 border-orange-200",
    "REJECTED": "bg-rose-50 text-rose-700 border-rose-200",
    "DUPLICATE": "bg-gray-100 text-gray-700 border-gray-300",
    "EXTRACTED": "bg-blue-50 text-blue-700 border-blue-200",
    "MATCHED": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "MISMATCH": "bg-red-50 text-red-700 border-red-200",
    "FAILED": "bg-rose-50 text-rose-700 border-rose-200",
    "NOT CHECKED": "bg-gray-50 text-gray-500 border-gray-200",
    "NOT FOUND": "bg-orange-50 text-orange-700 border-orange-200",
  }[status] || "bg-gray-50 text-gray-700 border-gray-200";

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border tracking-wide ${styles}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

export function Button({ children, variant = 'primary', className = '', ...props }: any) {
  const base = "inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-blue-500",
    danger: "bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500",
  };
  return <button className={`${base} ${variants[variant as keyof typeof variants]} ${className}`} {...props}>{children}</button>;
}
