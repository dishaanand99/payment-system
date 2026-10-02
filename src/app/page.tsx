"use client";
import React from "react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="w-20 h-20 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-500/30">
          <span className="text-white text-3xl font-bold">H</span>
        </div>
        
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">NGO Donation System</h1>
          <p className="text-lg text-gray-500 mt-3 max-w-lg mx-auto">
            A standalone application for managing NGO donations, payment verification, and reconciliation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto mt-8">
          <Link href="/donate" className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-sm border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all group">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900">Donor Portal</h2>
            <p className="text-sm text-gray-500 mt-1">Make a donation</p>
          </Link>

          <Link href="/admin" className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-sm border border-gray-200 hover:border-slate-800 hover:shadow-md transition-all group">
            <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900">Admin Dashboard</h2>
            <p className="text-sm text-gray-500 mt-1">Manage system</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
