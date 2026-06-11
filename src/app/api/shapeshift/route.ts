import { NextRequest, NextResponse } from 'next/server';
import { execFile, spawn } from 'child_process';
import path from 'path';

// ─── Shapeshift via the eero CLI (PTY-driven, job-based) ──────────────────────
// `eero shapeshift` is interactive (needs a TTY confirmation) and long-running
// (OTA + reboot + heartbeat = several minutes). So we:
//   1. Run it through scripts/shapeshift_pty.py, which allocates a pseudo-terminal
//      and auto-answers the confirmation prompt.
//   2. Run it as a BACKGROUND JOB. POST starts the job and returns a jobId
//      immediately; the client polls GET ?jobId=... for live status + output.
//
// Auth: uses the machine's stored eero admin tokens (stage + prod). Obtain via
//   `eero api admin auth` and `eero api admin --prod auth`.
//
// SECURITY: args are passed as an argv array (no shell); inputs are validated
// against a strict whitelist. This performs a real, privileged action on live
// eeros — the dashboard must confirm before calling POST.

export const dynamic = 'force-dynamic';

const EERO_BIN = process.env.EERO_CLI_PATH || '/opt/homebrew/bin/eero';
const PTY_SCRIPT = path.join(process.cwd(), 'scripts', 'shapeshift_pty.py');
const SAFE_VALUE = /^[A-Za-z0-9 ._:@+\-]{1,128}$/;

type TargetEnv = 'stage' | 'prod';
type JobStatus = 'running' | 'success' | 'failed';

interface Job {
  id: string;
  target: TargetEnv;
  eero?: string;
  network?: string;
  user?: string;
  status: JobStatus;
  output: string;
  startedAt: number;
  finishedAt?: number;
  exitCode?: number;
}

// In-memory job registry. Survives for the life of the server process, which is
// fine for this single-operator tool. (A DB/queue would be the production move.)
const g = globalThis as any;
if (!g.__shapeshiftJobs) g.__shapeshiftJobs = new Map<string, Job>();
const JOBS: Map<string, Job> = g.__shapeshiftJobs;

function runEero(args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    execFile(EERO_BIN, args, { timeout: 20000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      const code = error && typeof (error as any).code === 'number' ? (error as any).code : error ? 1 : 0;
      resolve({ code, stdout: stdout?.toString() ?? '', stderr: stderr?.toString() ?? '' });
    });
  });
}

function startJob(job: Job, args: string[]) {
  const child = spawn('python3', [PTY_SCRIPT, ...args], {
    cwd: process.cwd(),
    env: process.env,
  });

  child.stdout.on('data', (d) => { job.output += d.toString(); });
  child.stderr.on('data', (d) => { job.output += d.toString(); });

  child.on('close', (code) => {
    job.exitCode = code ?? 0;
    job.status = code === 0 ? 'success' : 'failed';
    job.finishedAt = Date.now();
  });
  child.on('error', (err) => {
    job.output += `\n[spawn error] ${err.message}`;
    job.status = 'failed';
    job.finishedAt = Date.now();
  });
}

// ─── POST: start a shapeshift job ─────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { target, eero, network, user } = body as {
      target: TargetEnv; eero?: string; network?: string; user?: string;
    };

    if (target !== 'stage' && target !== 'prod') {
      return NextResponse.json({ success: false, error: 'target must be "stage" or "prod".' }, { status: 400 });
    }
    if ((eero && network) || (!eero && !network)) {
      return NextResponse.json({ success: false, error: 'Specify exactly one of "eero" or "network".' }, { status: 400 });
    }
    for (const [key, val] of Object.entries({ eero, network, user })) {
      if (val !== undefined && !SAFE_VALUE.test(val)) {
        return NextResponse.json({ success: false, error: `Invalid characters in "${key}".` }, { status: 400 });
      }
    }
    if (user && !network) {
      return NextResponse.json({ success: false, error: '"user" is only valid together with "network".' }, { status: 400 });
    }

    // Build args for the PTY helper.
    const args = ['--to', target];
    if (eero) args.push('--eero', eero);
    if (network) args.push('--network', network);
    if (user) args.push('--user', user);

    const id = crypto.randomUUID();
    const job: Job = {
      id, target, eero, network, user,
      status: 'running', output: '', startedAt: Date.now(),
    };
    JOBS.set(id, job);
    startJob(job, args);

    return NextResponse.json({ success: true, jobId: id, status: 'running' });
  } catch (error: any) {
    console.error('[shapeshift] POST error', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal error' }, { status: 500 });
  }
}

// ─── GET: poll a job (?jobId=) OR report CLI/auth status (no params) ───────────
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');

  if (jobId) {
    const job = JOBS.get(jobId);
    if (!job) return NextResponse.json({ found: false, error: 'Unknown jobId.' }, { status: 404 });
    return NextResponse.json({
      found: true,
      jobId: job.id,
      status: job.status,
      output: job.output,
      target: job.target,
      eero: job.eero || null,
      network: job.network || null,
      exitCode: job.exitCode ?? null,
      durationMs: (job.finishedAt ?? Date.now()) - job.startedAt,
    });
  }

  // Status check: CLI present + admin tokens (stage AND prod) authenticated.
  try {
    const version = await runEero(['--version']);
    const stageAuth = await runEero(['api', 'admin', 'about']);
    const prodAuth = await runEero(['api', 'admin', '--prod', 'about']);
    const stageOk = stageAuth.code === 0;
    const prodOk = prodAuth.code === 0;
    return NextResponse.json({
      available: version.code === 0,
      version: version.stdout.trim() || version.stderr.trim(),
      adminStageAuthenticated: stageOk,
      adminProdAuthenticated: prodOk,
      // Shapeshift orchestrates through prod; prod token is the critical one.
      ready: version.code === 0 && prodOk,
      bin: EERO_BIN,
    });
  } catch (error: any) {
    return NextResponse.json({ available: false, ready: false, error: error.message }, { status: 500 });
  }
}
