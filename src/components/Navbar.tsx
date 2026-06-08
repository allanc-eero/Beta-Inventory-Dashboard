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
  { id: 'overview', label: 'Overview' },
  { id: 'devices', label: 'Devices' },
  { id: 'testbeds', label: 'Programs' },
  { id: 'locations', label: 'Locations' },
  { id: 'people', label: 'People' },
  { id: 'packages', label: 'Packages' },
  { id: 'shapeshift', label: 'Shapeshift' },
  { id: 'shipments', label: 'Ingestion & Returns' },
  { id: 'dogfood', label: 'Dogfooders' },
];

export default function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { currentUser, logout, canEdit, isBetaViewer } = useAuthStore();

  // Beta Viewers see most tabs but not Packages, Shapeshift, Ingestion & Returns, or Dogfood
  const visibleTabs = isBetaViewer()
    ? tabs.filter((t) => !['packages', 'shapeshift', 'shipments', 'dogfood'].includes(t.id))
    : tabs;

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
                onClick={() => setActiveTab('overview')}
                className="text-white font-semibold text-sm cursor-pointer hover:text-white/90"
              >
                eero Fetch
              </h1>
            </div>

            {/* Center: Tabs */}
            <div className="flex items-center gap-1">
              {visibleTabs.map((tab) => (
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

              {/* User info + dropdown */}
              {currentUser && (
                <div className="relative flex items-center gap-2">
                  {!canEdit() && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-yellow-400/20 text-yellow-200 rounded font-medium">VIEW ONLY</span>
                  )}
                  <span className="text-xs text-white/70">{currentUser.name}</span>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-medium hover:bg-white/30 transition-all"
                  >
                    {currentUser.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </button>
                  {showUserMenu && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <div className="px-3 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{currentUser.name}</p>
                        <p className="text-xs text-gray-500">{currentUser.email}</p>
                        <p className="text-xs text-gray-400 capitalize mt-0.5">{currentUser.role.replace('_', ' ')}</p>
                      </div>
                      <button
                        onClick={() => { setShowUserMenu(false); logout(); }}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
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
