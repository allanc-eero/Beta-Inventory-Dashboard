import { NextRequest, NextResponse } from 'next/server';

const JIRA_BASE_URL = process.env.JIRA_BASE_URL!;
const JIRA_USER_EMAIL = process.env.JIRA_USER_EMAIL!;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN!;
const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY!;

const authHeader = `Basic ${Buffer.from(`${JIRA_USER_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`;

const headers = {
  Authorization: authHeader,
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

// ─── POST: Create issue or transition ─────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'create') {
      return await createIssue(body);
    } else if (action === 'transition') {
      return await transitionIssue(body);
    } else if (action === 'createEpic') {
      return await createEpic(body);
    } else {
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[JIRA API Error]', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}

// ─── GET: Fetch issue or search ───────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const issueKey = searchParams.get('key');
    const jql = searchParams.get('jql');

    if (issueKey) {
      // Fetch single issue
      const res = await fetch(`${JIRA_BASE_URL}/rest/api/3/issue/${issueKey}`, { headers });
      if (!res.ok) {
        const err = await res.text();
        return NextResponse.json({ error: err }, { status: res.status });
      }
      const data = await res.json();
      return NextResponse.json(data);
    }

    if (jql) {
      // Search issues
      const res = await fetch(
        `${JIRA_BASE_URL}/rest/api/3/search?jql=${encodeURIComponent(jql)}&maxResults=50&fields=summary,status,assignee,priority,created,updated`,
        { headers }
      );
      if (!res.ok) {
        const err = await res.text();
        return NextResponse.json({ error: err }, { status: res.status });
      }
      const data = await res.json();
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: 'Provide ?key= or ?jql=' }, { status: 400 });
  } catch (error: any) {
    console.error('[JIRA API Error]', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}

// ─── Create Issue ─────────────────────────────────────────────────────────────
async function createIssue(body: any) {
  const { summary, description, issueType, epicKey, priority, labels, assigneeEmail } = body;

  const payload: any = {
    fields: {
      project: { key: JIRA_PROJECT_KEY },
      summary,
      issuetype: { name: issueType || 'Task' },
      description: {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: description || '' }],
          },
        ],
      },
    },
  };

  // Link to epic
  if (epicKey) {
    payload.fields.parent = { key: epicKey };
  }

  // Priority (skip if not supported by project)
  // if (priority) {
  //   payload.fields.priority = { name: priority };
  // }

  // Labels
  if (labels && labels.length > 0) {
    payload.fields.labels = labels;
  }

  const res = await fetch(`${JIRA_BASE_URL}/rest/api/3/issue`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('[JIRA Create Issue Failed]', err);
    return NextResponse.json({ error: err }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json({
    success: true,
    key: data.key,
    id: data.id,
    url: `${JIRA_BASE_URL}/browse/${data.key}`,
  });
}

// ─── Transition Issue ─────────────────────────────────────────────────────────
async function transitionIssue(body: any) {
  const { issueKey, transitionName } = body;

  // First, get available transitions
  const transRes = await fetch(`${JIRA_BASE_URL}/rest/api/3/issue/${issueKey}/transitions`, { headers });
  if (!transRes.ok) {
    const err = await transRes.text();
    return NextResponse.json({ error: err }, { status: transRes.status });
  }

  const { transitions } = await transRes.json();
  const target = transitions.find(
    (t: any) => t.name.toLowerCase() === transitionName.toLowerCase()
  );

  if (!target) {
    return NextResponse.json(
      { error: `Transition "${transitionName}" not found. Available: ${transitions.map((t: any) => t.name).join(', ')}` },
      { status: 400 }
    );
  }

  // Execute the transition
  const res = await fetch(`${JIRA_BASE_URL}/rest/api/3/issue/${issueKey}/transitions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ transition: { id: target.id } }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: res.status });
  }

  return NextResponse.json({ success: true, transitionedTo: target.name });
}

// ─── Create Epic ──────────────────────────────────────────────────────────────
async function createEpic(body: any) {
  const { summary, description } = body;

  const payload = {
    fields: {
      project: { key: JIRA_PROJECT_KEY },
      summary,
      issuetype: { name: 'Epic' },
      description: {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: description || '' }],
          },
        ],
      },
    },
  };

  const res = await fetch(`${JIRA_BASE_URL}/rest/api/3/issue`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('[JIRA Create Epic Failed]', err);
    return NextResponse.json({ error: err }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json({
    success: true,
    key: data.key,
    id: data.id,
    url: `${JIRA_BASE_URL}/browse/${data.key}`,
  });
}
