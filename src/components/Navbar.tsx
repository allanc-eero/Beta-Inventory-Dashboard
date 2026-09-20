'use client';

import { useState, useEffect } from 'react';
import { TabType } from '@/types';
import { Layout, Sidebar, Segmented } from '@amzn/eero-web-design-components';
import { Search, Wifi } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import SearchModal from './SearchModal';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { APP_NAME } from '@/constants';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  children: React.ReactNode;
}

const tabs: { id: TabType; label: string; key: string }[] = [
  { id: 'devices', label: 'Devices', key: 'devices' },
  { id: 'surveys', label: 'Programs', key: 'surveys' },
  { id: 'people', label: 'People', key: 'people' },
  { id: 'locations', label: 'Locations', key: 'locations' },
  { id: 'shipments', label: 'Ingestion & Returns', key: 'shipments' },
  // Hidden from the sidebar — Dogfooders + Program Sign-ups are being split into a
  // separate app. Code/routes kept intact; just not surfaced here. See docs/TODO.md.
  // { id: 'dogfood', label: 'Dogfooders', key: 'dogfood' },
  // { id: 'program_signups', label: 'Program Sign-ups', key: 'program_signups' },
];

export default function Navbar({ activeTab, setActiveTab, children }: NavbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { currentUser, logout, canEdit, isBetaViewer } = useAuthStore();
  const { cohort, setCohort } = useUiStore();
  const { data: ssoSession } = useSession();

  // Clear the app session, and end the SSO session too when one exists — otherwise
  // the SSO bridge would immediately re-log-in from the still-valid IdP session.
  const handleSignOut = () => {
    logout();
    if (ssoSession) signOut({ callbackUrl: '/' });
  };

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
      {/* Left zone: brand (flex-1 so the center search stays truly centered) */}
      <div className="flex flex-1 items-center gap-3 min-w-0">
        <span className="flex shrink-0 items-center gap-1.5 font-semibold text-[var(--ui-core-midnight-midnight-1)]" title={APP_NAME}>
          <Wifi size={16} className="text-[var(--ui-core-periwinkle-periwinkle-4)]" strokeWidth={2} />
          {APP_NAME}
        </span>
        {/* Cohort/environment lens — filters every menu to Beta (prod), Dogfood (stage), or All */}
        <div className="shrink-0" title="Filter the whole app by cohort">
          <Segmented
            value={cohort}
            onChange={(v) => setCohort(v as typeof cohort)}
            items={[
              { label: 'All', value: 'all' },
              { label: 'Beta', value: 'beta' },
              { label: 'Dogfood', value: 'dogfood' },
            ]}
          />
        </div>
      </div>

      {/* Center zone: search — its own equal-width third so it's truly centered */}
      <div className="flex flex-1 justify-center">
        <button
          onClick={() => setSearchOpen(true)}
          className="flex w-full max-w-md items-center gap-2 rounded-lg bg-[var(--ui-core-midnight-midnight-8)] px-3 py-2 text-sm text-[var(--ui-core-midnight-midnight-6)] transition-all hover:bg-[var(--ui-core-midnight-midnight-7)]"
        >
          <Search size={16} className="shrink-0" />
          <span className="flex-1 truncate text-left">Search devices, testers, programs, locations…</span>
        </button>
      </div>

      {/* Right zone: user (flex-1, right-aligned) */}
      <div className="flex flex-1 items-center justify-end gap-2">
        {currentUser && (
          <>
            {!canEdit() && (
              <span className="text-xs px-1.5 py-0.5 bg-[var(--ui-core-orange-orange-2)] text-[var(--ui-core-orange-orange-7)] rounded font-medium">VIEW ONLY</span>
            )}
            <span className="text-xs text-[var(--ui-core-midnight-midnight-3)]">{currentUser.name}</span>
            <button
              onClick={handleSignOut}
              className="text-xs text-[var(--ui-core-red-red-5)] hover:text-[var(--ui-core-red-red-4)] font-medium"
            >
              Sign out
            </button>
          </>
        )}
      </div>
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
        <div id="main-content" className="h-full overflow-y-auto py-6 px-12">
          {children}
        </div>
      </Layout>

      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </>
  );
}
