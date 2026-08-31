'use client';

import { useState, useEffect } from 'react';
import { TabType } from '@/types';
import { Layout, Sidebar } from '@amzn/eero-web-design-components';
import SearchModal from './SearchModal';
import { useAuthStore } from '@/store/authStore';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  children: React.ReactNode;
}

const tabs: { id: TabType; label: string; key: string }[] = [
  { id: 'overview', label: 'Overview', key: 'overview' },
  { id: 'devices', label: 'Devices', key: 'devices' },
  { id: 'testbeds', label: 'Programs', key: 'testbeds' },
  { id: 'locations', label: 'Locations', key: 'locations' },
  { id: 'people', label: 'People', key: 'people' },
  { id: 'surveys', label: 'Surveys', key: 'surveys' },
  { id: 'shipments', label: 'Ingestion & Returns', key: 'shipments' },
  { id: 'dogfood', label: 'Dogfooders', key: 'dogfood' },
  { id: 'program_signups', label: 'Program Sign-ups', key: 'program_signups' },
];

export default function Navbar({ activeTab, setActiveTab, children }: NavbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { currentUser, logout, canEdit, isBetaViewer } = useAuthStore();

  const visibleTabs = isBetaViewer()
    ? tabs.filter((t) => !['shipments', 'dogfood', 'program_signups'].includes(t.id))
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

  const menuItems = visibleTabs.map((tab) => ({
    url: `#${tab.id}`,
    label: tab.label,
    key: tab.key,
    renderLink: (props: { to: string; key: string; title?: string; className?: string }, linkChildren: React.ReactNode) => (
      <a
        key={props.key}
        href={props.to}
        title={props.title}
        onClick={(e) => {
          e.preventDefault();
          setActiveTab(tab.id);
        }}
        className={props.className || ''}
      >
        {linkChildren}
      </a>
    ),
  }));

  const headerElement = (
    <div className="flex w-full items-center gap-3 px-4 py-2">
      <button
        onClick={() => setSearchOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--ui-background-layer-layer-page-backplate)] hover:bg-[var(--ui-background-layer-layer-page-hover)] rounded-lg text-[var(--ui-text-text-tertiary)] hover:text-[var(--ui-text-text-primary)] text-xs transition-all"
      >
        <span>Search</span>
        <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 bg-[var(--ui-background-layer-layer-page-backplate)] rounded text-xs text-[var(--ui-text-text-placeholder)]">⌘K</kbd>
      </button>

      {currentUser && (
        <div className="ml-auto flex items-center gap-2">
          {!canEdit() && (
            <span className="text-xs px-1.5 py-0.5 bg-[var(--ui-core-orange-orange-2)] text-[var(--ui-core-orange-orange-7)] rounded font-medium">VIEW ONLY</span>
          )}
          <span className="text-xs text-[var(--ui-text-text-tertiary)]">{currentUser.name}</span>
          <button
            onClick={logout}
            className="text-xs text-[var(--ui-core-red-red-6)] hover:text-[var(--ui-core-red-red-7)] font-medium"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      <Layout
        collapsed={collapsed}
        onCollapseMenu={() => setCollapsed(!collapsed)}
        sidenav={
          <Sidebar
            menuItems={menuItems}
            collapsed={collapsed}
            currentURL={`#${activeTab}`}
          />
        }
        header={headerElement}
        mainContentElementId="main-content"
      >
        <div id="main-content" className="h-full overflow-y-auto py-6 px-6">
          {children}
        </div>
      </Layout>

      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </>
  );
}
