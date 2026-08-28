import { NextRequest, NextResponse } from 'next/server';

/**
 * DEMO route — lists Qualtrics XM Directory "Lists" (contact/mailing lists) and
 * their contacts. Isolated from the real /api/qualtrics route. Used by the
 * /demo-surveys dropdown to import a program's final tester list.
 *
 * The legacy top-level /mailinglists route is deprecated (410); the current
 * path is directory-scoped: /directories/{directoryId}/mailinglists.
 *
 * If the live call fails (token scope, deprecation, offline demo), we fall back
 * to seeded data so the dropdown always works — the standard demo seam.
 */

const QUALTRICS_BASE_URL = process.env.QUALTRICS_BASE_URL;
const QUALTRICS_API_TOKEN = process.env.QUALTRICS_API_TOKEN;
const QUALTRICS_DIRECTORY_ID = process.env.QUALTRICS_DIRECTORY_ID;

const headers = {
  'X-API-TOKEN': QUALTRICS_API_TOKEN || '',
  'Content-Type': 'application/json',
};

// Seeded fallback (mirrors the real "Residential Beta" directory lists).
const FALLBACK_LISTS = [
  { id: 'CG_demo_macsec_recruit', name: '[MacSec] Recruiting', contactCount: 899, source: 'seed' },
  { id: 'CG_demo_macsec_v2', name: '[MacSec] Recruiting V2', contactCount: 306, source: 'seed' },
  { id: 'CG_demo_macsec_shield', name: '[MacSec] - Shield Performance Testers', contactCount: 97, source: 'seed' },
  { id: 'CG_demo_macsec_v3', name: '[MacSec] Recruiting V3 (Employee: Beta-A)', contactCount: 130, source: 'seed' },
  { id: 'CG_demo_merci_perf', name: '[Merci 10.3 PVT - Mahalo] All Performance Testers', contactCount: 108, source: 'seed' },
  { id: 'CG_demo_merci_recruit', name: '[Merci 10.3 - Mahalo] Recruiting V2', contactCount: 66, source: 'seed' },
  { id: 'CG_demo_xenia_trident', name: '[Xenia/Wormhole DVT] Trident CA/UK/EU/JP - Residential Testers', contactCount: 17, source: 'seed' },
  { id: 'CG_demo_xenia_eb', name: '[Xenia/Wormhole EVT - Prometheus] eB Testers', contactCount: 9, source: 'seed' },
];

const FALLBACK_CONTACTS = [
  { email: 'diego.kim@eero.com', firstName: 'Diego', lastName: 'Kim' },
  { email: 'aaron@eero.com', firstName: 'Aaron', lastName: 'Rivera' },
  { email: 'layton.hill@eero.com', firstName: 'Layton', lastName: 'Hill' },
  { email: 'philip.rivera@eero.com', firstName: 'Philip', lastName: 'Rivera' },
  { email: 'stacia@eero.com', firstName: 'Stacia', lastName: 'Wong' },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const listId = searchParams.get('listId');
  const canCallLive = QUALTRICS_BASE_URL && QUALTRICS_API_TOKEN && QUALTRICS_DIRECTORY_ID;

  // ── Contacts for a specific list ──
  if (listId) {
    if (!canCallLive || listId.startsWith('CG_demo_')) {
      return NextResponse.json({ contacts: FALLBACK_CONTACTS, source: 'seed' });
    }
    try {
      const res = await fetch(
        `${QUALTRICS_BASE_URL}/directories/${QUALTRICS_DIRECTORY_ID}/mailinglists/${listId}/contacts`,
        { headers, cache: 'no-store' }
      );
      if (!res.ok) throw new Error(`Qualtrics ${res.status}`);
      const data = await res.json();
      const contacts = (data.result?.elements || []).map((c: any) => ({
        email: c.email,
        firstName: c.firstName,
        lastName: c.lastName,
      }));
      return NextResponse.json({ contacts, source: 'live' });
    } catch (err: any) {
      return NextResponse.json({ contacts: FALLBACK_CONTACTS, source: 'seed', warning: err.message });
    }
  }

  // ── All lists in the directory ──
  if (!canCallLive) {
    return NextResponse.json({ lists: FALLBACK_LISTS, source: 'seed' });
  }
  try {
    const res = await fetch(
      `${QUALTRICS_BASE_URL}/directories/${QUALTRICS_DIRECTORY_ID}/mailinglists`,
      { headers, cache: 'no-store' }
    );
    if (!res.ok) throw new Error(`Qualtrics ${res.status}`);
    const data = await res.json();
    const lists = (data.result?.elements || []).map((l: any) => ({
      id: l.mailingListId || l.id,
      name: l.name,
      contactCount: l.contactCount ?? null,
      source: 'live',
    }));
    return NextResponse.json({ lists, source: 'live' });
  } catch (err: any) {
    return NextResponse.json({ lists: FALLBACK_LISTS, source: 'seed', warning: err.message });
  }
}
