'use client';

import { TabType } from '@/types';
import { useState, useEffect } from 'react';
import SearchModal from './SearchModal';
import { useAuthStore } from '@/store/authStore';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

const tabs: { id: TabType; label: string }[] = [
  { id: 'devices', label: 'Devices' },
  { id: 'testbeds', label: 'Programs' },
  { id: 'locations', label: 'Locations' },
  { id: 'people', label: 'People' },
  { id: 'shipments', label: 'Device Ingestion & Returns' },
];

export default function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const { currentUser, logout, canEdit } = useAuthStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <nav className="bg-[#2c3e7a] shadow-md fixed top-0 left-0 right-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-12">
            {/* Left: Title */}
            <div className="flex items-center mr-8">
              <h1
                onClick={() => setActiveTab('devices')}
                className="text-white font-semibold text-sm cursor-pointer hover:text-white/90"
              >
                Simplified Inventory Dashboard
              </h1>
            </div>

            {/* Center: Tabs */}
            <div className="flex items-center gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-white/20 text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Right: Search + User */}
            <div className="ml-auto flex items-center gap-3">
              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded text-white/70 hover:text-white text-xs transition-all"
              >
                <span>Search</span>
                <kbd className="hidden sm:inline-flex items-center px-1 py-0.5 bg-white/10 rounded text-[10px]">⌘K</kbd>
              </button>

              {/* User info + logout */}
              {currentUser && (
                <div className="flex items-center gap-2">
                  {!canEdit() && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-yellow-400/20 text-yellow-200 rounded font-medium">VIEW ONLY</span>
                  )}
                  <span className="text-xs text-white/70">{currentUser.name}</span>
                  <button
                    onClick={logout}
                    className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-medium hover:bg-white/30 transition-all"
                    title="Sign out"
                  >
                    {currentUser.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </>
  );
}
