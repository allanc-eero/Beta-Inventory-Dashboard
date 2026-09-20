// Pure, deterministic helpers for the Programs feature.
//
// Everything here is side-effect-free and JSX-free: seeding math, formatting,
// and the demo's identity-match simulation (email → network → beta-model DSN).
// Keeping them out of ProgramsView makes the view file mostly components + wiring,
// and lets these be unit-tested in isolation. JSX tag renderers and chart
// primitives intentionally stay in ProgramsView (they're view concerns).
import type {
  ProgramType, TechnicalLevel, DemoTester, DemoProgram, DemoSurvey,
  SurveyWave, RosterEntry, AssignedDevice,
} from './types';
import { Device, Program } from '@/types';

// ─── Seeding / math primitives ───────────────────────────────────────────────

// Stable 32-bit hash of a string — the deterministic seed behind every simulated
// metric, so a given email/serial always maps to the same numbers.
export function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

// GGC54MX36114xxxx-style serial so it reads like a real eero DSN.
export function mkSerial(seed: number): string {
  const tail = (4000 + seed).toString(36).toUpperCase().padStart(4, '0');
  return `GGC54MX36114${tail}`;
}

export function rate(responses: number, recipients: number) {
  return recipients > 0 ? Math.round((responses / recipients) * 100) : 0;
}

// "2026-09-08" -> "Sep 8". Used across the wave/phase timelines.
export function fmtDate(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// The latest wave is the one we show by default; falls back to the survey's own
// flat responses/recipients for one-offs that carry no wave history.
export function latestWave(s: DemoSurvey): SurveyWave | null {
  return s.waves && s.waves.length ? s.waves[s.waves.length - 1] : null;
}

// Engagement is DERIVED from real activity (response reliability + missed surveys) —
// not a self-reported attribute. Same thresholds as the reliability bar's colors.
export function engagementLevel(t: DemoTester): { label: string; color: 'green' | 'orange' | 'red' } {
  if (t.reliability >= 60 && t.missedSurveys <= 1) return { label: 'High', color: 'green' };
  if (t.reliability >= 30) return { label: 'Medium', color: 'orange' };
  return { label: 'Low', color: 'red' };
}

// Simulated async call — the demo seam that a real Qualtrics/Bedrock call swaps into.
export function simulate<T>(value: T, ms = 1400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

// ─── Program / device derivations ──────────────────────────────────────────────

// The beta model this program's units report as (drives the auto-filter).
export function betaModelFor(program: DemoProgram): string {
  const n = program.name.toLowerCase();
  if (n.includes('merci')) return 'Merci';
  if (n.includes('outdoor')) return 'Outdoor Pro';
  if (n.includes('foghorn')) return 'Foghorn';
  return 'Beta Unit';
}

// Map a demo program onto the real deviceStore Program enum — this is the key
// that DevicesTab groups containers by. Seed devices are all 'beta', so a beta
// program's assigned devices must also be 'beta' to land in the same "Merci BETA"
// container the Devices menu shows. Phase (DVT/EVT/PVT) is separate metadata (a
// tag), NOT the container key.
export function programEnumFor(program: DemoProgram): Program {
  return program.name.toLowerCase().includes('dogfood') ? 'dogfood' : 'beta';
}

const COUNTRY_POOL = [
  { name: 'Australia', code: 'AUS' }, { name: 'United States', code: 'USA' },
  { name: 'United Kingdom', code: 'GBR' }, { name: 'Germany', code: 'DEU' },
  { name: 'Canada', code: 'CAN' }, { name: 'Japan', code: 'JPN' },
];

// Region a device reports from — in production this is the eero network's
// geo-IP/timezone from Insight (where it's installed), not the shipped-to address.
export function countryForSerial(serial: string): { name: string; code: string } {
  return COUNTRY_POOL[hashSeed(serial) % COUNTRY_POOL.length];
}

// ─── Roster / identity-match simulation ──────────────────────────────────────

const ROSTER_NAMES = [
  'Shakeel Ahmad', 'Mark D Jones', 'Christer Whitehorn', 'Abilio J Henrique',
  'Patrick Evans', 'Santosh Choudhary', 'Aun Iftikhar', 'Sarah McLennan',
  'Jagdeep Singh', 'Hai Bu', 'Warren Cammack', 'Frank Fan',
];

// Turn a real Qualtrics contact into a program tester. The identity (name/email)
// is REAL (from the live Qualtrics list); engagement metrics are deterministically
// simulated from the email until survey-response data is wired in — so a real
// roster gets stable, plausible numbers instead of placeholders.
export function contactToTester(
  contact: { email: string; firstName?: string; lastName?: string },
  program: { id: string; name: string; type: ProgramType },
): DemoTester {
  const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ').trim() || contact.email.split('@')[0];
  const seed = hashSeed(contact.email);
  const levels: TechnicalLevel[] = ['Beginner', 'Intermediate', 'Advanced'];
  return {
    id: `${program.id}-${contact.email}`,
    name,
    email: contact.email,
    programName: program.name,
    technicalLevel: levels[seed % 3],
    reliability: 40 + (seed % 60),                                  // 40–99%
    avgResponseDays: Math.round(((seed % 50) / 10 + 0.5) * 10) / 10, // 0.5–5.4d
    feedbackQuality: 3 + (seed % 3),                                // 3–5
    deviceOnline: program.type === 'feature' ? null : seed % 4 !== 0, // ~75% online (hardware)
    missedSurveys: seed % 4,                                        // 0–3
  };
}

// Deterministic per-program roster with a realistic match distribution:
// most testers auto-match to one beta unit, a few have multiple (pick one),
// a few don't resolve (wrong/mismatched email → fix in-app).
export function rosterForProgram(program: DemoProgram): RosterEntry[] {
  if (program.type === 'feature') return []; // feature programs ship no hardware
  const model = betaModelFor(program);
  const count = Math.min(program.audienceSize, 12);
  const out: RosterEntry[] = [];
  for (let i = 0; i < count; i++) {
    const name = ROSTER_NAMES[i % ROSTER_NAMES.length];
    const handle = name.toLowerCase().replace(/[^a-z]+/g, '.');
    const r = (i * 7 + program.id.length) % 10;
    if (r === 2 || r === 9) {
      // unmatched — the list email (corporate) never resolved to an eero account
      out.push({ id: `${program.id}-r${i}`, tester: name, email: `${handle}@amazon.com`, match: 'unmatched', candidates: [] });
    } else if (r === 5) {
      // multiple — their account has two beta-model eeros; must pick the right one
      out.push({
        id: `${program.id}-r${i}`, tester: name, email: `${handle}@gmail.com`, match: 'multiple',
        candidates: [
          { serial: mkSerial(i * 3 + 1), model, online: true },
          { serial: mkSerial(i * 3 + 2), model, online: i % 2 === 0 },
        ],
      });
    } else {
      const serial = mkSerial(i + 1);
      out.push({
        id: `${program.id}-r${i}`, tester: name, email: `${handle}@gmail.com`, match: 'matched',
        candidates: [{ serial, model, online: r !== 4 }], selectedSerial: serial,
      });
    }
  }
  return out;
}

// Seed each tester with a deterministic device set so the roster isn't blank in
// the demo. Mirrors /api/insight's seededSerialLookup mix: most testers have one
// matched unit, some have two (multi-device), some are pending, a few have none.
export function seedAssignments(program: DemoProgram): Record<string, AssignedDevice[]> {
  const model = betaModelFor(program);
  const map: Record<string, AssignedDevice[]> = {};
  program.testers.forEach((t) => {
    if (t.noSeedDevice) { map[t.id] = []; return; }                   // roster filler — never assign a device
    const seed = hashSeed(t.email);
    const r = seed % 10;
    if (r === 2 || r === 9) { map[t.id] = []; return; }               // not shipped / not assigned yet
    const primary = mkSerial((seed % 900) + 3);
    if (r === 4) {                                                     // assigned but pending activation
      map[t.id] = [{ serial: primary, model, networkId: null, status: 'pending', firmware: '', source: 'seed' }];
      return;
    }
    const networkId = String(17000000 + (seed % 99999));
    const devices: AssignedDevice[] = [
      { serial: primary, model, networkId, status: r === 6 ? 'offline' : 'online', firmware: 'v7.3-beta', source: 'seed' },
    ];
    if (r === 5) {                                                     // multi-device tester (2 units, same mesh)
      devices.push({ serial: mkSerial((seed % 900) + 4), model, networkId, status: 'online', firmware: 'v7.3-beta', source: 'seed' });
    }
    map[t.id] = devices;
  });
  return map;
}

// Shape an assigned device into a full deviceStore Device so it appears in the
// Devices menu (grouped by program) and flows to People (assignedEmail) and
// Locations (country). Deterministic id keeps re-syncs idempotent.
export function toStoreDevice(tester: DemoTester, d: AssignedDevice, program: DemoProgram): Device {
  const country = d.networkId ? countryForSerial(d.serial).name : '';
  const now = new Date().toISOString();
  return {
    id: `prog-${program.id}-${d.serial}`,
    serialNumber: d.serial,
    model: 'eero Max 7',
    manufacturer: 'eero',
    revision: '', revisionNotes: '', hardwareConfig: '', mac: '',
    internalName: `${betaModelFor(program)} beta`,
    sku: '', partNumber: '',
    country,
    adminId: '',
    unitId: `UID000${2900000 + (hashSeed(d.serial) % 99999)}`,
    deactivated: false,
    firmwareVersion: d.firmware,
    environment: '',
    status: d.status === 'online' ? 'online' : 'not_online',
    assignedTo: tester.name,
    assignedEmail: tester.email,
    contactEmail: '', alternateEmail: '',
    location: country,
    adminLocation: '',
    network: d.networkId || '',
    program: programEnumFor(program),
    product: betaModelFor(program),
    assetTag: '', poExpensify: '', accountingId: '', cost: '', purchaseDate: '',
    imei1: '', imei2: '', eid: '', tracking: '', jira: '',
    checkedOutTo: tester.name, checkedOutDate: now,
    dueDate: '', notes: '',
    shipmentStatus: 'delivered',
    fcLocation: '', leg1Carrier: '', leg1Tracking: '', leg1Date: '',
    leg2Carrier: '', leg2Tracking: '', leg2Date: '',
    testbedId: '', testbedName: program.name,
    createdAt: now, updatedAt: now,
  };
}

// Slugify a program name into a stable, unique 'pg-...' id (dedupes against
// existing ids). Used by the New Program modal.
export function slugify(name: string, existingIds: string[]) {
  const base = 'pg-' + (name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'program');
  if (!existingIds.includes(base)) return base;
  let i = 2;
  while (existingIds.includes(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}
