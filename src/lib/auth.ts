import type { NextAuthOptions } from 'next-auth';

/**
 * App-level OIDC SSO (NextAuth). Provider-agnostic: point OIDC_ISSUER at any
 * OpenID Connect provider (e.g. eero's Okta) and it discovers endpoints via
 * /.well-known/openid-configuration.
 *
 * SEAM: when OIDC_ISSUER is unset, NO providers are registered — the app falls
 * back to the local @eero.com email login (see LoginPage). When set, users sign
 * in through SSO. Either way, the @eero.com roster in authStore remains the
 * AUTHORIZATION layer (who's allowed + their role); SSO only proves identity.
 *
 * Required env when enabling SSO:
 *   OIDC_ISSUER, OIDC_CLIENT_ID, OIDC_CLIENT_SECRET, AUTH_SECRET, NEXTAUTH_URL
 */
const oidcEnabled = !!process.env.OIDC_ISSUER;

export const SSO_PROVIDER_ID = 'oidc';

export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  providers: oidcEnabled
    ? [
        {
          id: SSO_PROVIDER_ID,
          name: 'eero SSO',
          type: 'oauth',
          wellKnown: `${process.env.OIDC_ISSUER}/.well-known/openid-configuration`,
          clientId: process.env.OIDC_CLIENT_ID,
          clientSecret: process.env.OIDC_CLIENT_SECRET,
          authorization: { params: { scope: 'openid email profile' } },
          idToken: true,
          checks: ['pkce', 'state'],
          profile(profile: any) {
            return {
              id: profile.sub,
              name: profile.name ?? profile.preferred_username ?? profile.email,
              email: profile.email,
            };
          },
        } as any,
      ]
    : [],
  callbacks: {
    // Keep the verified email/name on the token → session so the client bridge
    // can map it to the authStore roster (role/permissions).
    async jwt({ token, profile }) {
      if (profile?.email) token.email = profile.email;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.email) session.user.email = token.email as string;
      return session;
    },
  },
};
