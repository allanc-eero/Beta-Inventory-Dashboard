'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

/**
 * ⚠️ DEV PREVIEW ONLY — NOT FOR PRODUCTION.
 *
 * Convenience route to see the FULL app (navbar: Devices / People / Locations /
 * Shipments / Surveys) without fighting a persisted login. It force-signs-in as
 * an admin and redirects to `/`. This bypasses the auth gate with no credentials,
 * so it must never ship to a real environment — it exists purely for local demos.
 */
export default function Preview() {
  const router = useRouter();

  useEffect(() => {
    // Overwrite any persisted session (e.g. a stuck dogfooder) with an admin.
    useAuthStore.getState().login('allanc@eero.com');
    router.replace('/');
  }, [router]);

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif', color: '#3a4045' }}>
      Signing in as admin and opening the full app…
    </div>
  );
}
