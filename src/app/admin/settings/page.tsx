"use client";
import React, { useState } from 'react';
import { Card, Button } from '@/components/ui/shared';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('ngo');

  const tabs = [
    { id: 'ngo', name: 'NGO Information' },
    { id: 'payment', name: 'Payment Methods' },
    { id: 'bank', name: 'Bank Accounts' },
    { id: 'verification', name: 'Verification Settings' },
    { id: 'ocr', name: 'OCR Settings' },
    { id: 'users', name: 'Admin Users' },
    { id: 'security', name: 'Security' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Configure application behavior and integration settings.</p>
        </div>
        <Button variant="primary">Save Changes</Button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Settings Sidebar */}
        <div className="w-full md:w-64 shrink-0">
          <nav className="flex md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-sm font-medium rounded-lg text-left whitespace-nowrap transition-colors ${activeTab === tab.id ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="flex-1 space-y-6">
          <Card>
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
              <h3 className="font-semibold text-gray-900">
                {tabs.find(t => t.id === activeTab)?.name} Configuration
              </h3>
            </div>
            <div className="p-6 space-y-6">
              {activeTab === 'ngo' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-medium text-gray-700">NGO Name</label>
                    <input type="text" defaultValue="Hope Foundation" className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Contact Email</label>
                    <input type="email" defaultValue="contact@hopefoundation.example.org" className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Contact Phone</label>
                    <input type="tel" defaultValue="+91 9876543210" className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
              )}

              {activeTab === 'bank' && (
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                    <strong>Reminder:</strong> Do not enter real production bank credentials into this UI.
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">HDFC Bank</p>
                      <p className="text-xs text-gray-500 font-mono">**** **** **** 1234</p>
                    </div>
                    <Button variant="secondary" className="!px-3 !py-1 text-xs">Edit</Button>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">SBI</p>
                      <p className="text-xs text-gray-500 font-mono">**** **** **** 9876</p>
                    </div>
                    <Button variant="secondary" className="!px-3 !py-1 text-xs">Edit</Button>
                  </div>
                  <Button variant="secondary" className="w-full border-dashed">Add Bank Account</Button>
                </div>
              )}

              {activeTab !== 'ngo' && activeTab !== 'bank' && (
                <div className="text-center py-10 text-gray-500">
                  <p>Settings for {tabs.find(t => t.id === activeTab)?.name} will appear here.</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
