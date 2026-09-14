import { NextResponse } from 'next/server';
import { bedrockConfigured } from '@/lib/bedrock';

export const dynamic = 'force-dynamic';

/**
 * READINESS PREFLIGHT — GET /api/health
 *
 * Reports, per integration, whether the env/creds needed for the LIVE path are
 * present. This is how you prove "is it ready to go live?" without deploying:
 * every integration shows `configured: true/false` and the `mode` it will run in
 * (live vs fallback). It NEVER returns secret values — only presence booleans.
 *
 *   curl -s localhost:3000/api/health | jq
 *
 * `ready` (per integration) = the server-side creds exist.
 * `enabled` (client flag)   = the NEXT_PUBLIC_* seam is flipped to the live source.
 * A feature only runs fully live when BOTH are true.
 */

const has = (v: string | undefined): boolean => typeof v === 'string' && v.trim().length > 0;

export async function GET() {
  const bedrock = {
    ready: bedrockConfigured(),                 // BEDROCK_MODEL_ID present
    enabled: process.env.NEXT_PUBLIC_AI_SUMMARY === 'bedrock',
    region: process.env.BEDROCK_REGION || process.env.AWS_REGION || 'us-east-1',
    note: 'Also needs AWS creds resolvable by the default provider chain (IAM role / env / SSO).',
  };

  const qualtrics = {
    ready: has(process.env.QUALTRICS_API_TOKEN) && has(process.env.QUALTRICS_BASE_URL),
    directoryConfigured: has(process.env.QUALTRICS_DIRECTORY_ID),
  };

  const qualtricsWebhook = {
    // Receiver works even without a secret, but a secret is required to be safe in prod.
    secretConfigured: has(process.env.QUALTRICS_WEBHOOK_SECRET),
    enabled: process.env.NEXT_PUBLIC_ENGAGEMENT_SOURCE === 'qualtrics',
    note: 'Live delivery also requires a PUBLIC https URL for /api/qualtrics/webhook and a registered subscription (see scripts/register-qualtrics-webhook.mjs).',
  };

  const jira = {
    ready:
      has(process.env.JIRA_BASE_URL) &&
      has(process.env.JIRA_USER_EMAIL) &&
      has(process.env.JIRA_API_TOKEN) &&
      has(process.env.JIRA_PROJECT_KEY),
  };

  const databricks = {
    ready:
      has(process.env.DATABRICKS_HOST) &&
      has(process.env.DATABRICKS_TOKEN) &&
      has(process.env.DATABRICKS_WAREHOUSE_ID),
  };

  const insight = {
    ready: has(process.env.EERO_API_TOKEN),
    apiBase: process.env.EERO_USER_API_BASE || 'https://api-user.e2ro.com',
  };

  const breadboard = {
    ready: has(process.env.BREADBOARD_API_BASE),
    enabled: process.env.NEXT_PUBLIC_INVENTORY_SOURCE === 'breadboard',
  };

  const integrations = { bedrock, qualtrics, qualtricsWebhook, jira, databricks, insight, breadboard };

  // Top-level roll-up: which live features are fully wired (creds + flag).
  const liveFeatures = {
    aiSummary: bedrock.ready && bedrock.enabled,
    engagement: qualtrics.ready && qualtricsWebhook.enabled,
    dogfoodInventory: breadboard.ready && breadboard.enabled,
  };

  return NextResponse.json({
    ok: true,
    checkedAt: new Date().toISOString(),
    integrations,
    liveFeatures,
  });
}
