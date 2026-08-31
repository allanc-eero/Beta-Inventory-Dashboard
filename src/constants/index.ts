import { Carrier } from '@/types';

// WDS Tag color palette (from @amzn/eero-web-design-components Tag typings).
export type TagColor = 'grey' | 'navy' | 'periwinkle' | 'green' | 'orange' | 'red' | 'turquoise' | 'ocean' | 'purple' | 'terracotta' | 'yellow';

// ─── Shared Constants ─────────────────────────────────────────────────────────

export const REGIONS = ['USA', 'CA', 'EU', 'UK', 'AUS', 'NZ', 'JPN', 'SG', 'Other'] as const;
export type Region = (typeof REGIONS)[number];

export const CARRIER_COLORS: Record<Carrier, TagColor> = {
  DHL: 'yellow',
  FedEx: 'purple',
  UPS: 'terracotta',
  USPS: 'periwinkle',
  Other: 'grey',
};

export const CARRIERS: Carrier[] = ['UPS', 'USPS', 'FedEx', 'DHL', 'Other'];

export const TRACKING_URLS: Record<string, string> = {
  UPS: 'https://www.ups.com/track?tracknum=',
  USPS: 'https://tools.usps.com/go/TrackConfirmAction?tLabels=',
  FedEx: 'https://www.fedex.com/fedextrack/?trknbr=',
  DHL: 'https://www.dhl.com/us-en/home/tracking/tracking-express.html?submit=1&tracking-id=',
  Other: '',
};

export const EPIC_MAP: Record<string, string> = {
  beta: 'BETA-SHIPMENTS',
  dogfood: 'DOGFOOD-SHIPMENTS',
  prq: 'PRQ-SHIPMENTS',
  pvt: 'PVT-SHIPMENTS',
  evt: 'EVT-SHIPMENTS',
  dvt: 'DVT-SHIPMENTS',
  other: 'GENERAL-SHIPMENTS',
};

export const RETURN_EPIC_MAP: Record<string, string> = {
  beta: 'BETA-RETURNS',
  dogfood: 'DOGFOOD-RETURNS',
  prq: 'PRQ-RETURNS',
  pvt: 'PVT-RETURNS',
  evt: 'EVT-RETURNS',
  dvt: 'DVT-RETURNS',
  other: 'GENERAL-RETURNS',
};

export const JIRA_EPIC_KEY = 'BPM-1886';
export const JIRA_BASE_URL = 'https://eeroinc.atlassian.net';

// ─── Shared Helpers ───────────────────────────────────────────────────────────

// Build a carrier tracking URL from a carrier name + tracking number.
// Carrier matching is case-insensitive; unknown carriers fall back to a search.
export function getTrackingUrl(carrier: string, trackingNumber: string): string {
  const tn = (trackingNumber || '').trim();
  if (!tn) return '';
  const key = (carrier || '').toUpperCase();
  const base =
    key === 'UPS' ? TRACKING_URLS.UPS :
    key === 'USPS' ? TRACKING_URLS.USPS :
    key === 'FEDEX' ? TRACKING_URLS.FedEx :
    key === 'DHL' ? TRACKING_URLS.DHL :
    '';
  return base ? `${base}${tn}` : `https://www.google.com/search?q=${encodeURIComponent(tn + ' tracking')}`;
}

const DOMESTIC_COUNTRIES = new Set(['united states', 'us', 'usa', 'canada', 'ca']);

// True if the tester is US/Canada (domestic return flow); else international.
export function isDomesticCountry(country: string): boolean {
  return DOMESTIC_COUNTRIES.has((country || '').toLowerCase().trim());
}

// Return the returns-epic key for a program, defaulting to GENERAL-RETURNS.
export function getReturnEpic(program: string): string {
  return RETURN_EPIC_MAP[program] || RETURN_EPIC_MAP.other;
}

// Shared device-status badge config (WDS Tag color + label), used by device tables/panels.
export const STATUS_CONFIG: Record<string, { color: TagColor; label: string }> = {
  online: { color: 'green', label: 'Online' },
  not_online: { color: 'orange', label: 'Not Online' },
  in_repair: { color: 'red', label: 'In Repair' },
  in_testing: { color: 'periwinkle', label: 'In Testing' },
  pending_return: { color: 'orange', label: 'Pending Return' },
  deactivated: { color: 'grey', label: 'Deactivated' },
};

// Resolve a status to its badge config, with a safe fallback.
export function getStatusBadge(status: string): { color: TagColor; label: string } {
  return STATUS_CONFIG[status] || { color: 'grey', label: status };
}

// ─── CSV export ───────────────────────────────────────────────────────────────
// Build a CSV from rows and trigger a browser download. Each cell is quoted and
// inner quotes escaped, so commas/quotes/newlines in values are safe.
export function downloadCSV(filename: string, rows: (string | number | null | undefined)[][]): void {
  const csv = rows
    .map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Today's date as YYYY-MM-DD — handy for export filenames.
export function todayStamp(): string {
  return new Date().toISOString().split('T')[0];
}

// ─── Relative time ─────────────────────────────────────────────────────────────
// Human "time ago" from a date string. style 'long' → "Just now / 5m ago / 3h ago
// / 2d ago / Never"; style 'short' → "today / 3h / 2d". Safe on null/invalid input.
export function timeAgo(date: string | null | undefined, style: 'long' | 'short' = 'long'): string {
  if (!date) return style === 'short' ? '—' : 'Never';
  const ms = Date.now() - new Date(date).getTime();
  if (isNaN(ms)) return style === 'short' ? '—' : 'Never';
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (style === 'short') {
    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    return 'today';
  }
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// ─── Time constants & day math ──────────────────────────────────────────────
export const DAY_MS = 24 * 60 * 60 * 1000;
export const OVERDUE_DAYS = 14; // return considered overdue after this many days

// Whole days elapsed since a date (floored). Returns 0 on null/invalid input.
export function daysSince(date: string | null | undefined): number {
  if (!date) return 0;
  const ms = Date.now() - new Date(date).getTime();
  return isNaN(ms) ? 0 : Math.floor(ms / DAY_MS);
}

// Whole days until a future date (ceiled). Negative if the date is in the past.
export function daysUntil(date: string | null | undefined): number {
  if (!date) return 0;
  const ms = new Date(date).getTime() - Date.now();
  return isNaN(ms) ? 0 : Math.ceil(ms / DAY_MS);
}
