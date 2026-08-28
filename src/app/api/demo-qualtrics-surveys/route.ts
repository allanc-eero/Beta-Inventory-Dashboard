import { NextResponse } from 'next/server';

/**
 * DEMO route — lists Qualtrics SURVEYS (the survey definitions you author in
 * Qualtrics), so the New Survey flow can point a program's survey at the real
 * Qualtrics survey that Insight collects responses from.
 *
 * Isolated from the real /api/qualtrics route. Tries the live XM API
 * (GET {base}/surveys); falls back to a seeded list so the picker always works.
 */

const QUALTRICS_BASE_URL = process.env.QUALTRICS_BASE_URL;
const QUALTRICS_API_TOKEN = process.env.QUALTRICS_API_TOKEN;

const headers = {
  'X-API-TOKEN': QUALTRICS_API_TOKEN || '',
  'Content-Type': 'application/json',
};

// Seeded fallback — a realistic spread across programs, phases, and survey kinds
// (recruiting, OOBE, weekly performance, RTM, packaging, final) so the picker
// reads like a real Qualtrics survey library.
const FALLBACK_SURVEYS = [
  { id: 'SV_seed_merci_recruit', name: '[Merci PVT] Recruiting', isActive: true },
  { id: 'SV_seed_merci_oobe', name: '[Merci PVT] OOBE / Setup Validation', isActive: true },
  { id: 'SV_seed_merci_weekly', name: '[Merci PVT] Weekly Performance', isActive: true },
  { id: 'SV_seed_merci_rtm', name: '[Merci PVT] RTM Validation', isActive: true },
  { id: 'SV_seed_merci_pkg', name: '[Merci PVT] Packaging / Unboxing', isActive: true },
  { id: 'SV_seed_merci_dvt_weekly', name: '[Merci DVT] Weekly Performance', isActive: true },
  { id: 'SV_seed_merci_dvt_rtm', name: '[Merci DVT] RTM Validation', isActive: false },
  { id: 'SV_seed_foghorn_oobe', name: '[Foghorn FW 7.2] Setup Experience', isActive: true },
  { id: 'SV_seed_foghorn_weekly', name: '[Foghorn FW 7.2] Weekly Performance', isActive: true },
  { id: 'SV_seed_foghorn_final', name: '[Foghorn FW 7.2] Final Summary', isActive: false },
  { id: 'SV_seed_outdoor_oobe', name: '[Outdoor Dogfood] Coverage & Mounting', isActive: false },
  { id: 'SV_seed_outdoor_weekly', name: '[Outdoor Dogfood] Weekly Performance', isActive: false },
  { id: 'SV_seed_xenia_recruit', name: '[Xenia/Wormhole DVT] Recruiting', isActive: true },
  { id: 'SV_seed_xenia_oobe', name: '[Xenia/Wormhole DVT] OOBE / Setup', isActive: true },
  { id: 'SV_seed_xenia_weekly', name: '[Xenia/Wormhole DVT] Weekly Performance', isActive: true },
  { id: 'SV_seed_xenia_rtm', name: '[Xenia/Wormhole EVT] RTM Validation', isActive: true },
  { id: 'SV_seed_app_concept', name: '[App Experience] Redesign Concept Test', isActive: true },
  { id: 'SV_seed_app_resetup', name: '[App Experience] Re-setup / OOBE Re-test', isActive: true },
];

export async function GET() {
  if (!QUALTRICS_BASE_URL || !QUALTRICS_API_TOKEN) {
    return NextResponse.json({ surveys: FALLBACK_SURVEYS, source: 'seed' });
  }
  try {
    const res = await fetch(`${QUALTRICS_BASE_URL}/surveys`, { headers, cache: 'no-store' });
    if (!res.ok) throw new Error(`Qualtrics ${res.status}`);
    const data = await res.json();
    const surveys = (data.result?.elements || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      isActive: s.isActive ?? true,
    }));
    // If the org returns an empty list, fall back so the picker is never empty.
    if (!surveys.length) return NextResponse.json({ surveys: FALLBACK_SURVEYS, source: 'seed' });
    return NextResponse.json({ surveys, source: 'live' });
  } catch (err: any) {
    return NextResponse.json({ surveys: FALLBACK_SURVEYS, source: 'seed', warning: err.message });
  }
}
