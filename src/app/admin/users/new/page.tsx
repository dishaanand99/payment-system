"use client";
import React, { useState, useTransition } from 'react';
import { Card, Button } from '@/components/ui/shared';
import { createUserAction } from '@/app/actions';

export default function NewUserPage() {
  const [errorMsg, setErrorMsg] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setErrorMsg('');
    
    startTransition(async () => {
      const res = await createUserAction(null, formData);
      if (res && res.error) {
        setErrorMsg(res.error);
      }
    });
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Add New Admin User</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-md text-sm">
              {errorMsg}
            </div>
          )}
          
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Full Name</label>
            <input name="name" required type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="John Doe" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Email Address</label>
            <input name="email" required type="email" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="john@demo.org" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Password</label>
            <input name="password" required type="password" minLength={8} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Role</label>
            <select name="role" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="VIEWER">VIEWER</option>
              <option value="VERIFIER">VERIFIER</option>
              <option value="ADMIN">ADMIN</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <a href="/admin/users" className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</a>
            <Button variant="primary" disabled={isPending}>{isPending ? 'Creating...' : 'Create User'}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
