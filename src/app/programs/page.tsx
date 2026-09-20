'use client';

// Full-screen view of the Programs / Surveys & Engagement feature at /programs.
// The implementation lives in src/components/programs/ProgramsView.tsx so it's
// shared with the in-app "Programs" tab (src/app/page.tsx).
import { ToastProvider } from '@amzn/eero-web-design-components';
import { ProgramsView } from '@/components/programs/ProgramsView';

export default function ProgramsRoute() {
  return (
    <ToastProvider>
      <ProgramsView />
    </ToastProvider>
  );
}
