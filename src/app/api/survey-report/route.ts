import { NextRequest, NextResponse } from 'next/server';
import { canCallLive, listSurveys, buildLiveReport } from '@/lib/server/qualtricsReport';
import { SEED_SURVEYS, seedReport } from '@/components/surveysEngagement/mockData';

/**
 * Live Qualtrics data for the Surveys & Engagement report (in the Surveys tab).
 *
 *   GET ?action=list                              → active surveys [{id,name}]
 *   GET ?action=report&surveyId=&from=&to=        → normalized LiveReport
 *
 * Uses the same env token as /api/demo-qualtrics-lists. Falls back to seeded
 * data (with a `notice`) if the live call can't run — e.g. the token lacks the
 * "read responses" scope — so the view always renders.
 */

// Response exports can take a few seconds to generate.
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'list';

  if (action === 'list') {
    if (!canCallLive) return NextResponse.json({ surveys: SEED_SURVEYS, source: 'seed' });
    try {
      const surveys = await listSurveys();
      return NextResponse.json({ surveys, source: 'live' });
    } catch (err: any) {
      return NextResponse.json({ surveys: SEED_SURVEYS, source: 'seed', warning: err.message });
    }
  }

  if (action === 'report') {
    const surveyId = searchParams.get('surveyId') || '';
    const from = searchParams.get('from') || '';
    const to = searchParams.get('to') || '';
    if (!surveyId || !from || !to) {
      return NextResponse.json({ error: 'surveyId, from and to are required' }, { status: 400 });
    }
    if (!canCallLive) {
      return NextResponse.json(seedReport(surveyId, from, to, 'No Qualtrics credentials configured — showing sample data.'));
    }
    try {
      const report = await buildLiveReport(surveyId, from, to);
      return NextResponse.json(report);
    } catch (err: any) {
      return NextResponse.json(seedReport(surveyId, from, to, `Live Qualtrics call failed (${err.message}) — showing sample data.`));
    }
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 });
}
