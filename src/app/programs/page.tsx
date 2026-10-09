'use client';

// Full-screen view of the Programs / Surveys & Engagement feature at /programs.
// The implementation lives in src/components/programs/ProgramsView.tsx so it's
// shared with the in-app "Programs" tab (src/app/page.tsx).
import { ToastProvider } from '@amzn/eero-web-design-components';
import { ProgramsView } from '@/components/programs/ProgramsView';
import SeedDataProvider from '@/components/SeedDataProvider';

export default function ProgramsRoute() {
  return (
    // SeedDataProvider: same first-load seeding as the main app, so program
    // devices exist even if /programs is the first page opened.
    <SeedDataProvider>
      <ToastProvider>
        <ProgramsView />
      </ToastProvider>
    </SeedDataProvider>
  );
}
