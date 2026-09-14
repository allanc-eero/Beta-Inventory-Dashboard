'use client';

/**
 * PREVIEW ROUTE — /demo-dogfood
 * Lets you look at the dogfooder-facing experience without going through auth:
 *   1. Login / Register — the @eero.com sign-in + multi-step dogfood registration.
 *   2. Dogfooder Portal — the platform a dogfooder sees for their own account
 *      (dashboard, my devices, my programs, report a bug, learn, profile, returns).
 *
 * The portal reads the logged-in user from the auth store, so this page seeds a
 * demo dogfooder (matched to a real seed device) to populate it. Use "Exit
 * preview" to clear that demo session.
 */

import { useEffect, useState } from 'react';
import { Segmented, Button } from '@amzn/eero-web-design-components';
import LoginPage from '@/components/LoginPage';
import DogfooderPortal from '@/components/DogfooderPortal';
import SeedDataProvider from '@/components/SeedDataProvider';
import { useAuthStore, User } from '@/store/authStore';

// Demo dogfooder — email/name match a seed device so the portal shows real content.
const DEMO_DOGFOODER: User = {
  email: 'shkahma@amazon.com',
  name: 'Shakeel Ahmad',
  role: 'dogfoofer',
  status: 'active',
  profile: {
    welcomeSeen: false,
    phoneOS: 'iOS',
    hasEeroNetwork: 'Yes',
    testGroup: 'Latest and greatest firmware',
    streetAddress: '12 Kew Road',
    city: 'Kew',
    state: 'VIC',
    zipCode: '3101',
    phoneNumber: '+61 400 123 456',
    sqFeet: '1000-2000',
    productionEmail: 'shakeel.personal@gmail.com',
    registeredAt: new Date().toISOString(),
  },
};

export default function DemoDogfoodPage() {
  const [view, setView] = useState<'portal' | 'login'>('portal');
  const { logout } = useAuthStore();

  // Seed the demo dogfooder whenever the portal view is active.
  useEffect(() => {
    if (view === 'portal') {
      useAuthStore.setState({ currentUser: DEMO_DOGFOODER });
    }
  }, [view]);

  return (
    <SeedDataProvider>
      <div className="min-h-screen bg-[var(--ui-background-layer-background-page)]">
        {/* Preview control bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--ui-background-layer-border-border-layer-page)] px-6 py-2" style={{ backgroundColor: 'var(--ui-core-periwinkle-periwinkle-1)' }}>
          <span className="text-xs" style={{ color: 'var(--ui-core-periwinkle-periwinkle-8)' }}>
            DEMO PREVIEW · <b>/demo-dogfood</b> · dogfooder-facing experience · seeded as a demo dogfooder
          </span>
          <div className="flex items-center gap-2">
            <Segmented
              value={view}
              onChange={(v) => setView(v as 'portal' | 'login')}
              items={[
                { label: 'Dogfooder Portal', value: 'portal' },
                { label: 'Login / Register', value: 'login' },
              ]}
            />
            <Button type="text" label="Exit preview" onClick={() => logout()} />
          </div>
        </div>

        {view === 'portal' ? <DogfooderPortal /> : <LoginPage />}
      </div>
    </SeedDataProvider>
  );
}
