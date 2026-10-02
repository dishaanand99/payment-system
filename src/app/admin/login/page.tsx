"use client";
import React, { useState, useTransition } from 'react';
import { loginAction } from '@/app/actions';

export default function LoginPage() {
  const [errorMsg, setErrorMsg] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setErrorMsg('');
    
    startTransition(async () => {
      const res = await loginAction(null, formData);
      if (res && res.error) {
        setErrorMsg(res.error);
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm mx-auto">
          <span className="text-white font-bold text-xl">H</span>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Admin Portal Login
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Sign in to manage donations and verify payments
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-md text-sm">
                {errorMsg}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  name="email"
                  type="email"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  name="password"
                  type="password"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isPending}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 transition-all"
              >
                {isPending ? 'Signing in...' : 'Login'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
