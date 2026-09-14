#!/usr/bin/env node
/**
 * Register (or list/delete) a Qualtrics completedResponse webhook that points at
 * our receiver: POST <appUrl>/api/qualtrics/webhook
 *
 * This is the one real step that turns the engagement pipeline live. It needs:
 *   - QUALTRICS_API_TOKEN     (env)  a token with event-subscription scope
 *   - QUALTRICS_BASE_URL      (env)  e.g. https://iad1.qualtrics.com/API/v3
 *   - QUALTRICS_WEBHOOK_SECRET(env)  optional; appended as ?secret= so only
 *                                    Qualtrics can post (our receiver checks it)
 *   - a PUBLIC https app URL         Qualtrics is in the cloud; it cannot reach
 *                                    localhost. Deploy first, or use a tunnel.
 *
 * Usage:
 *   node scripts/register-qualtrics-webhook.mjs --survey SV_xxx --url https://app.example.com
 *   node scripts/register-qualtrics-webhook.mjs --list
 *   node scripts/register-qualtrics-webhook.mjs --delete SUB_xxxxxxxx
 *
 * Docs: Qualtrics API > Managing Event Subscriptions. Topic for a submitted
 * response is `surveyengine.completedResponse.<surveyId>`.
 */

import { readFileSync } from 'node:fs';

// Minimal .env.local loader (no dependency) so `npm run webhook:register` sees
// the same vars Next.js loads. Real process env always wins over the file.
function loadEnvLocal() {
  for (const file of ['.env.local', '.env']) {
    try {
      for (const line of readFileSync(file, 'utf8').split('\n')) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (!m) continue;
        const key = m[1];
        if (process.env[key] !== undefined) continue; // don't clobber real env
        let val = m[2].trim().replace(/^["']|["']$/g, '');
        process.env[key] = val;
      }
    } catch {
      /* file may not exist — fine */
    }
  }
}
loadEnvLocal();

const TOKEN = process.env.QUALTRICS_API_TOKEN;
const SECRET = process.env.QUALTRICS_WEBHOOK_SECRET;
const RAW_BASE = process.env.QUALTRICS_BASE_URL;

function die(msg) {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
}

if (!TOKEN) die('QUALTRICS_API_TOKEN is not set.');
if (!RAW_BASE) die('QUALTRICS_BASE_URL is not set (e.g. https://iad1.qualtrics.com/API/v3).');

// Normalize base so it ends at /API/v3 exactly once.
const base = RAW_BASE.replace(/\/+$/, '').replace(/\/API\/v3$/, '') + '/API/v3';
const subsUrl = `${base}/eventsubscriptions`;

const headers = { 'X-API-TOKEN': TOKEN, 'Content-Type': 'application/json' };

// ── arg parsing ─────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const getFlag = (name) => {
  const i = args.indexOf(name);
  return i !== -1 ? args[i + 1] : undefined;
};

async function list() {
  const res = await fetch(subsUrl, { headers });
  const json = await res.json();
  if (!res.ok) die(`list failed (${res.status}): ${JSON.stringify(json)}`);
  const subs = json?.result?.elements || [];
  console.log(`\n${subs.length} event subscription(s):`);
  for (const s of subs) console.log(`  ${s.id}  ${s.topics}  →  ${s.publicationUrl}`);
  console.log('');
}

async function del(id) {
  const res = await fetch(`${subsUrl}/${id}`, { method: 'DELETE', headers });
  if (!res.ok) die(`delete failed (${res.status}): ${await res.text()}`);
  console.log(`\n✔ Deleted subscription ${id}\n`);
}

async function register(surveyId, appUrl) {
  const topic = getFlag('--topic') || `surveyengine.completedResponse.${surveyId}`;
  let publicationUrl = `${appUrl.replace(/\/+$/, '')}/api/qualtrics/webhook`;
  if (SECRET) publicationUrl += `?secret=${encodeURIComponent(SECRET)}`;

  if (!appUrl.startsWith('https://')) {
    die('--url must be a public https URL. Qualtrics cannot deliver to http or localhost.');
  }

  const res = await fetch(subsUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ topics: topic, publicationUrl, encrypt: false }),
  });
  const json = await res.json();
  if (!res.ok) die(`register failed (${res.status}): ${JSON.stringify(json)}`);

  console.log('\n✔ Webhook registered.');
  console.log(`  subscription id : ${json?.result?.id || '(see response)'}`);
  console.log(`  topic           : ${topic}`);
  console.log(`  delivers to     : ${publicationUrl.replace(/secret=[^&]+/, 'secret=***')}`);
  console.log('\nSubmit a test response to the survey, then GET /api/engagement to confirm.\n');
}

// ── dispatch ──────────────────────────────────────────────────────────────
const run = async () => {
  if (args.includes('--list')) return list();
  const delId = getFlag('--delete');
  if (delId) return del(delId);

  const survey = getFlag('--survey');
  const url = getFlag('--url');
  if (!survey || !url) {
    die('Usage: --survey SV_xxx --url https://app.example.com   (or --list / --delete SUB_xxx)');
  }
  return register(survey, url);
};

run().catch((e) => die(e?.message || String(e)));
