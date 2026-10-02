"use client";
import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { submitDonationAction } from '../actions';

export default function DonatePage() {
  const [submitted, setSubmitted] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setErrorMsg('');
    
    startTransition(async () => {
      const res = await submitDonationAction(null, formData);
      if (res.success) {
        setSubmitted(true);
      } else {
        setErrorMsg(res.message);
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold">H</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">Hope Foundation</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link href="#" className="hover:text-blue-600">About</Link>
            <Link href="#" className="hover:text-blue-600">Projects</Link>
            <Link href="#" className="hover:text-blue-600">Contact</Link>
            <Link href="/admin" className="hover:text-blue-600 text-xs text-gray-400">Admin Login</Link>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm transition-colors">Donate Now</button>
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {submitted ? (
          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-10 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Donation submitted successfully.</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">Thank you for your generous contribution. Your payment details have been received.</p>
            <div className="inline-block bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-lg font-medium">
              Status: PENDING VERIFICATION
            </div>
            <div className="mt-8">
              <button onClick={() => setSubmitted(false)} className="text-blue-600 hover:underline text-sm font-medium">Submit another donation</button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-700 to-blue-900 px-8 py-10 text-white">
              <h2 className="text-3xl font-bold mb-2">Make a Difference Today</h2>
              <p className="text-blue-100 text-sm">Your contribution goes directly to funding our active projects. Provide your payment details below.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {errorMsg && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-lg text-sm">
                  {errorMsg}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Full Name <span className="text-rose-500">*</span></label>
                  <input name="fullName" required type="text" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="John Doe" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Mobile Number <span className="text-rose-500">*</span></label>
                  <input name="mobile" required type="tel" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="+91 9876543210" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Email Address</label>
                  <input name="email" type="email" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="john@example.com" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">PAN (Optional)</label>
                  <input name="pan" type="text" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="ABCDE1234F" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Address (Optional)</label>
                  <input name="address" type="text" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="123 Example Street" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Donation Amount (₹) <span className="text-rose-500">*</span></label>
                  <input name="amount" required type="number" min="1" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="5000" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Payment Method <span className="text-rose-500">*</span></label>
                  <select name="method" required className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Select...</option>
                    <option value="UPI">UPI</option>
                    <option value="GOOGLE_PAY">Google Pay</option>
                    <option value="PAYTM">Paytm</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="PAYU">PayU</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Transaction ID / UTR <span className="text-rose-500">*</span></label>
                  <input name="utr" required type="text" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Reference Number" />
                </div>
                <div className="space-y-1.5 flex gap-4">
                  <div className="flex-1 space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Payment Date</label>
                    <input type="date" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Payment Time</label>
                    <input type="time" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Payment Screenshot <span className="text-rose-500">*</span></label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50 relative overflow-hidden group">
                    <input required type="file" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    {preview ? (
                      <div className="text-center z-0">
                        <img src={preview} alt="Preview" className="mx-auto h-32 object-contain rounded" />
                        <p className="text-sm text-blue-600 mt-2 font-medium">Change image</p>
                      </div>
                    ) : (
                      <div className="space-y-1 text-center z-0">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <p className="text-sm text-gray-600 font-medium">Click to upload or drag and drop</p>
                        <p className="text-xs text-gray-500">PNG, JPG, JPEG, WEBP up to 5MB</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 text-sm text-amber-800">
                <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p><strong>Notice:</strong> Uploading a payment screenshot does not automatically confirm your donation. Your payment will be verified against payment records by our team.</p>
              </div>

              <label className="flex items-start gap-3">
                <input required type="checkbox" className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                <span className="text-sm text-gray-600">I consent to the collection and processing of my details for donation tracking and receipt generation purposes.</span>
              </label>

              <button disabled={isPending} type="submit" className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white font-semibold py-3 px-4 rounded-lg shadow transition-all">
                {isPending ? 'Submitting...' : 'Submit Donation'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
