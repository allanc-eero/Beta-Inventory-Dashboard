'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

/**
 * Bridges a verified NextAuth (OIDC/SSO) session into the Zustand authStore:
 * once SSO proves identity, we look the email up in the roster to apply the
 * user's role. Only acts when a session exists — so with SSO disabled (local
 * dev, no OIDC provider), this is inert and the email login path is untouched.
 */
function SSOAuthBridge() {
  const { data: session, status } = useSession();
  const currentUser = useAuthStore((s) => s.currentUser);
  const loginFromSSO = useAuthStore((s) => s.loginFromSSO);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email && !currentUser) {
      loginFromSSO(session.user.email, session.user.name || '');
    }
  }, [status, session, currentUser, loginFromSSO]);

  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SSOAuthBridge />
      {children}
    </SessionProvider>
  );
}
