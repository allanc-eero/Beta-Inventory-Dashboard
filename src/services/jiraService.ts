// ─── JIRA Integration Service ─────────────────────────────────────────────────
// Client-side service that calls our Next.js API routes to interact with JIRA.
// All API tokens are stored server-side in .env.local — never exposed to the browser.

const API_BASE = '/api/jira';
const EPIC_KEY = process.env.NEXT_PUBLIC_JIRA_EPIC_KEY || 'BPM-1886';
const JIRA_BASE_URL = process.env.NEXT_PUBLIC_JIRA_BASE_URL || 'https://eeroinc.atlassian.net';

export interface JiraCreateResult {
  success: boolean;
  key: string;
  id: string;
  url: string;
  error?: string;
}

export interface JiraTransitionResult {
  success: boolean;
  transitionedTo?: string;
  error?: string;
}

// ─── Create a JIRA issue (Task) under the shipment tracking epic ──────────────
export async function createJiraIssue(params: {
  summary: string;
  description: string;
  epicKey?: string;
  priority?: string;
  labels?: string[];
}): Promise<JiraCreateResult> {
  try {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        summary: params.summary,
        description: params.description,
        issueType: 'Task',
        epicKey: params.epicKey || EPIC_KEY,
        labels: params.labels || ['inventory-dashboard', 'auto-created'],
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, key: '', id: '', url: '', error: data.error };
    }
    return data;
  } catch (error: any) {
    return { success: false, key: '', id: '', url: '', error: error.message };
  }
}

// ─── Transition a JIRA issue to a new status ──────────────────────────────────
export async function transitionJiraIssue(params: {
  issueKey: string;
  transitionName: string;
}): Promise<JiraTransitionResult> {
  try {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'transition',
        issueKey: params.issueKey,
        transitionName: params.transitionName,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error };
    }
    return data;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ─── Create the shipment tracking epic (run once) ─────────────────────────────
export async function createShipmentEpic(): Promise<JiraCreateResult> {
  try {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'createEpic',
        summary: 'Dogfood & Beta Device Shipment Tracking',
        description: 'Parent epic for all device shipment, return, and inventory tracking tickets created by the Simplified Inventory Dashboard.',
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, key: '', id: '', url: '', error: data.error };
    }
    return data;
  } catch (error: any) {
    return { success: false, key: '', id: '', url: '', error: error.message };
  }
}

// ─── Fetch issue details ──────────────────────────────────────────────────────
export async function getJiraIssue(issueKey: string) {
  try {
    const res = await fetch(`${API_BASE}?key=${issueKey}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ─── Search issues by JQL ─────────────────────────────────────────────────────
export async function searchJiraIssues(jql: string) {
  try {
    const res = await fetch(`${API_BASE}?jql=${encodeURIComponent(jql)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.issues || [];
  } catch {
    return [];
  }
}

// ─── Map Service Board status → JIRA transition name ──────────────────────────
// These need to match the actual transition names on your BPM board.
// You may need to adjust after checking available transitions.
export function getJiraTransitionName(serviceBoardStatus: string): string | null {
  const map: Record<string, string> = {
    intake: 'To Do',
    triage: 'To Do',
    assigned: 'In Progress',
    in_progress: 'In Progress',
    on_hold: 'To Do', // or 'Blocked' if available
    completed: 'Done',
    cancelled: 'Done',
  };
  return map[serviceBoardStatus] || null;
}
