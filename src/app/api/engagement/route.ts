import { NextResponse } from 'next/server';
import { computeEngagement, getResponseCount } from '@/lib/engagementStore';

/**
 * Serves per-tester engagement computed from ingested Qualtrics responses.
 * The Engagement view reads this and overlays it onto the roster (by email)
 * when ENGAGEMENT_LIVE is on.
 */
export async function GET() {
  const byEmail = computeEngagement();
  const has = getResponseCount() > 0;
  return NextResponse.json({
    source: has ? 'live' : 'none',
    byEmail,
    updatedAt: has ? new Date().toISOString() : null,
  });
}
