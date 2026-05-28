'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = login(email);
    if (!result.success) {
      setError(result.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="text-center mb-8">
            {/* Logo mark */}
            <div className="mx-auto w-16 h-16 mb-4">
              <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="64" height="64" rx="16" fill="#2c3e7a"/>
                <rect x="14" y="18" width="36" height="24" rx="4" stroke="white" strokeWidth="2.5" fill="none"/>
                <circle cx="32" cy="30" r="6" stroke="white" strokeWidth="2" fill="none"/>
                <path d="M26 30a6 6 0 0 1 12 0" stroke="white" strokeWidth="1.5" fill="none" opacity="0.5" transform="translate(0,-4) scale(1.5) translate(-10.5,-10)"/>
                <rect x="28" y="44" width="8" height="3" rx="1.5" fill="white" opacity="0.7"/>
                <circle cx="48" cy="20" r="4" fill="#4ade80" stroke="#2c3e7a" strokeWidth="1.5"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Beta Inventory Dashboard</h1>
            <p className="text-sm text-gray-500 mt-2">Sign in with your @eero.com email</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@eero.com"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Sign In
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-6">
            Only authorized @eero.com accounts can access this tool.
          </p>
        </div>
      </div>
    </div>
  );
}
