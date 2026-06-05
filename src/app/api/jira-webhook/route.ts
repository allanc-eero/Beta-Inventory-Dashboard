import { NextRequest, NextResponse } from 'next/server';

// ─── JIRA Webhook Receiver ────────────────────────────────────────────────────
// Register this URL in JIRA: Project Settings → Webhooks
// Events to listen for: issue_updated (specifically status changes)
// URL: https://your-domain.com/api/jira-webhook

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate webhook (basic check — in production use JIRA's webhook signature)
    const webhookEvent = body.webhookEvent;
    const issue = body.issue;
    const changelog = body.changelog;

    if (!issue || !changelog) {
      return NextResponse.json({ received: true, action: 'ignored — no issue or changelog' });
    }

    // Only process status changes
    const statusChange = changelog.items?.find((item: any) => item.field === 'status');
    if (!statusChange) {
      return NextResponse.json({ received: true, action: 'ignored — not a status change' });
    }

    const issueKey = issue.key;
    const newStatus = statusChange.toString; // e.g., "In Progress", "Done", "To Do"
    const oldStatus = statusChange.fromString;

    console.log(`[JIRA Webhook] ${issueKey}: ${oldStatus} → ${newStatus}`);

    // Map JIRA statuses to our Service Board columns
    const jiraToServiceBoardStatus: Record<string, string> = {
      'to do': 'intake',
      'planning': 'intake',
      'open': 'intake',
      'in progress': 'in_progress',
      'in review': 'in_progress',
      'assigned': 'assigned',
      'on hold': 'on_hold',
      'blocked': 'on_hold',
      'done': 'completed',
      'closed': 'completed',
      'resolved': 'completed',
      'cancelled': 'cancelled',
    };

    const mappedStatus = jiraToServiceBoardStatus[newStatus.toLowerCase()] || null;

    // Return the mapped status so the frontend can update
    // In production, this would push via WebSocket or SSE to connected clients
    return NextResponse.json({
      received: true,
      issueKey,
      oldStatus,
      newStatus,
      mappedServiceBoardStatus: mappedStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[JIRA Webhook Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Allow GET for webhook verification (some systems ping the URL first)
export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'jira-webhook-receiver' });
}
