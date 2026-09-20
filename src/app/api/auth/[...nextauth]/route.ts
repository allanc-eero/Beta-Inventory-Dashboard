import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

// NextAuth catch-all handler (sign-in, callback, session, sign-out).
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
