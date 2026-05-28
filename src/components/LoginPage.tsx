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
            <div className="mx-auto w-16 h-16 mb-4">
              <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Router body — rounded pill shape like an eero */}
                <ellipse cx="32" cy="42" rx="22" ry="10" fill="#2c3e7a"/>
                <ellipse cx="32" cy="40" rx="22" ry="10" fill="#3b5198"/>
                {/* WiFi signal arcs */}
                <path d="M32 12a20 20 0 0 1 14 5.8" stroke="#2c3e7a" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                <path d="M32 12a20 20 0 0 0-14 5.8" stroke="#2c3e7a" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                <path d="M32 20a12 12 0 0 1 8.5 3.5" stroke="#2c3e7a" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                <path d="M32 20a12 12 0 0 0-8.5 3.5" stroke="#2c3e7a" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                {/* Center dot */}
                <circle cx="32" cy="28" r="3" fill="#2c3e7a"/>
                {/* LED indicator */}
                <circle cx="32" cy="40" r="2" fill="#4ade80"/>
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
