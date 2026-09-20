'use client';

// Full-screen view of the Programs / Surveys & Engagement feature at /demo-surveys.
// The implementation lives in src/components/SurveysDemo.tsx so it's shared with
// the in-app "Programs" tab (src/app/page.tsx).
import { ToastProvider } from '@amzn/eero-web-design-components';
import { DemoSurveysInner } from '@/components/SurveysDemo';

export default function DemoSurveysRoute() {
  return (
    <ToastProvider>
      <DemoSurveysInner />
    </ToastProvider>
  );
}
