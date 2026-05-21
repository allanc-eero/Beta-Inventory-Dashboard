'use client';

import { TabType } from '@/types';
import { useState, useEffect } from 'react';
import SearchModal from './SearchModal';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

const tabs: { id: TabType; label: string }[] = [
  { id: 'devices', label: 'Devices' },
  { id: 'testbeds', label: 'Programs' },
  { id: 'locations', label: 'Locations' },
  { id: 'people', label: 'People' },
  { id: 'shipments', label: 'Shipments' },
];

export default function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);

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

            {/* Right: Search + Widgets */}
            <div className="ml-auto flex items-center gap-3">
              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded text-white/70 hover:text-white text-xs transition-all"
              >
                <span>Search</span>
                <kbd className="hidden sm:inline-flex items-center px-1 py-0.5 bg-white/10 rounded text-[10px]">⌘K</kbd>
              </button>

              {/* Notification bell */}
              <button className="relative p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
              </button>

              {/* Settings gear */}
              <button className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>

              {/* User avatar */}
              <button className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-medium hover:bg-white/30 transition-all">
                A
              </button>
            </div>
          </div>
        </div>
      </nav>

      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </>
  );
}
