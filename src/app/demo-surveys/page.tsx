'use client';

// Standalone demo preview route at /demo-surveys.
// The implementation lives in src/components/SurveysDemo.tsx so it can be reused
// both here and as the in-app "Surveys" tab (src/app/page.tsx).
import { ToastProvider } from '@amzn/eero-web-design-components';
import { DemoSurveysInner } from '@/components/SurveysDemo';

export default function DemoSurveysRoute() {
  return (
    <ToastProvider>
      <DemoSurveysInner />
    </ToastProvider>
  );
}
