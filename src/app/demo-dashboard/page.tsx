import { redirect } from 'next/navigation';

// The Dashboard preview has been promoted to the main app — old links land there.
export default function DemoDashboardRedirect() {
  redirect('/');
}
